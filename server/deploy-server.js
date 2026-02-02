import FtpDeploy from 'ftp-deploy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ftpDeploy = new FtpDeploy();

// Load FTP configuration
const configPath = path.join(__dirname, '.ftp-deploy-server.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ .ftp-deploy-server.json not found!');
    console.error('💡 Please create .ftp-deploy-server.json with your Hostinger FTP credentials');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('🚀 Starting backend deployment to Hostinger...');
console.log(`📁 Deploying from: ${config.localRoot}`);
console.log(`🌐 Deploying to: ${config.host}${config.remoteRoot}`);

ftpDeploy
    .deploy(config)
    .then(() => {
        console.log('✅ Backend deployment completed successfully!');
        console.log('💡 Remember to restart Node.js app in Hostinger control panel');
    })
    .catch((err) => {
        console.error('❌ Deployment failed:', err);
        process.exit(1);
    });

// Show progress
ftpDeploy.on('uploading', (data) => {
    console.log(`📤 Uploading: ${data.filename} (${data.transferredFileCount}/${data.totalFilesCount})`);
});

ftpDeploy.on('uploaded', (data) => {
    console.log(`✅ Uploaded: ${data.filename}`);
});

ftpDeploy.on('log', (data) => {
    console.log(`ℹ️  ${data}`);
});
