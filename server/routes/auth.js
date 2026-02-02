import express from 'express';
import { User, Board, Task, Notification, EmailVerification, sequelize } from '../models/index.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import { sendInviteEmail, createTransporter } from '../utils/email.js';
import { SERVER_CONFIG, GOOGLE_CONFIG, FRONTEND_CONFIG } from '../config/env.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(GOOGLE_CONFIG.CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const router = express.Router();

// @route   POST /api/auth/send-code
// @desc    Send numeric verification code to email
// @access  Public
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create or update verification record
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await EmailVerification.upsert({
      email,
      code,
      expiresAt
    });

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      // In development, we can log the code if transporter is not config
      if (SERVER_CONFIG.NODE_ENV === 'development') {
        console.log(`📡 [DEV] Verification code for ${email}: ${code}`);
        return res.json({ message: 'Code logged to server console (Dev Mode)' });
      }
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const mailOptions = {
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your TaskFlow account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #667eea;">TaskFlow Verification</h2>
          <p>Your 6-digit verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('❌ Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Check if database is connected
    try {
      await sequelize.authenticate();
    } catch (err) {
      console.error('❌ Database not connected - cannot perform registration');
      return res.status(503).json({
        error: 'Database not available. Please check database connection.'
      });
    }

    const { email, password, name, code, boardId } = req.body;

    console.log('📝 Register request received:', { email, name, hasPassword: !!password, hasCode: !!code });

    // Validation
    if (!email || !password || !name || !code) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ error: 'Please provide all fields and the verification code' });
    }

    // Verify code
    const verification = await EmailVerification.findOne({ where: { email } });
    if (!verification || verification.code !== code || new Date() > verification.expiresAt) {
      console.log('❌ Invalid or expired verification code');
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.count();
    const isFirstUser = userCount === 0;
    const userRole = isFirstUser ? 'admin' : 'user';

    if (isFirstUser) {
      console.log('👑 First user registered - assigning admin role');
    }

    // Create user
    console.log(`✅ Creating new user: ${email} with role: ${userRole}`);
    const user = await User.create({
      email,
      password,
      name,
      role: userRole,
    });

    console.log('👤 User created, ID:', user.id);

    if (user) {
      // Delete verification record
      await EmailVerification.destroy({ where: { email } });

      // If registered via invitation, add to board
      // If registered via invitation, add to board or update status
      if (boardId) {
        try {
          const board = await Board.findByPk(boardId);
          if (board) {
            const members = board.members || [];
            const existingMemberIndex = members.findIndex(m => m.email === user.email);

            if (existingMemberIndex !== -1) {
              // Update existing placeholder
              members[existingMemberIndex].id = user.id;
              members[existingMemberIndex].name = user.name;
              members[existingMemberIndex].status = 'active';
              members[existingMemberIndex].avatar = user.avatar || '';
            } else {
              // Add new member
              members.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'member',
                status: 'active',
                avatar: user.avatar || ''
              });
            }
            await board.update({ members });
            console.log(`🤝 User ${user.email} joined board ${boardId}`);
          }
        } catch (inviteError) {
          console.error('❌ Failed to auto-join board:', inviteError);
        }
      }

      console.log('✅ User created successfully:', user.email);
      res.status(201).json({
        _id: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      console.log('❌ Failed to create user');
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      error: error.message || 'Server error during registration',
      details: SERVER_CONFIG.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login request received:', { email, hasPassword: !!password });

    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Check if database is connected
    try {
      await sequelize.authenticate();
    } catch (err) {
      console.error('❌ Database not connected - cannot perform login');
      return res.status(503).json({
        error: 'Database not available. Please check database connection.'
      });
    }

    // Check for user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is OAuth-only (no password)
    if (!user.password) {
      console.log('❌ User is OAuth-only, cannot login with password:', email);
      return res.status(401).json({
        error: 'This account was created with Google. Please use Google login.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for user:', email);

    res.json({
      _id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: error.message || 'Server error during login',
      details: SERVER_CONFIG.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      _id: req.user.id,
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
      provider: req.user.provider,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    console.log('📝 Profile update request:', { userId: req.user.id, name, hasAvatar: !!avatar });

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    await user.update(updates);

    console.log('✅ Profile updated successfully:', user.email);

    res.json({
      _id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Redirect to Google OAuth
// @access  Public
router.get('/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_CONFIG.REDIRECT_URI)}&response_type=code&scope=profile%20email&access_type=offline&prompt=consent`;
  res.redirect(url);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_CONFIG.URL}/login?error=no_code`);

    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(
      GOOGLE_CONFIG.CLIENT_ID,
      GOOGLE_CONFIG.CLIENT_SECRET,
      GOOGLE_CONFIG.REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('🔑 Google tokens received');

    // Get user info from ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CONFIG.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    console.log('👤 Google User Info:', { email, name });

    // Find or create user
    let user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('🆕 Creating new user from Google');
      user = await User.create({
        googleId,
        email: email || `${googleId}@google.com`,
        name: name || email?.split('@')[0] || 'Google User',
        avatar: avatar || '',
        provider: 'google',
        role: 'user'
      });
    } else {
      console.log('🔄 Updating existing user from Google');
      // Update Google ID and avatar if not present
      await user.update({
        googleId: user.googleId || googleId,
        avatar: user.avatar || avatar,
        provider: 'google'
      });
    }

    const token = generateToken(user.id);
    console.log('🎫 JWT generated for user:', user.id);

    // Redirect back to frontend with token and user info
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    }));

    const finalRedirectUrl = `${FRONTEND_CONFIG.URL}/oauth-callback?token=${token}&user=${userData}`;
    console.log('🚀 Redirecting to:', finalRedirectUrl);

    res.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    res.redirect(`${FRONTEND_CONFIG.URL}/login?error=oauth_failed`);
  }
});

// @route   DELETE /api/auth/me
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/me', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // Delete all boards where the user is the owner (cascade will handle tasks)
    await Board.destroy({ where: { ownerId: userId } });

    // Delete tasks where user is assigned
    await Task.destroy({ where: { userId } });

    // Delete all notifications for the user
    await Notification.destroy({ where: { userId } });

    // Remove user from all boards where they are a member
    const boards = await Board.findAll();
    for (const board of boards) {
      if (board.members && Array.isArray(board.members)) {
        const updatedMembers = board.members.filter(m => m.id !== userId);
        if (updatedMembers.length !== board.members.length) {
          await board.update({ members: updatedMembers });
        }
      }
    }

    // Finally, delete the user itself
    await User.destroy({ where: { id: userId } });

    console.log(`✅ Account successfully deleted for user: ${userId}`);
    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
