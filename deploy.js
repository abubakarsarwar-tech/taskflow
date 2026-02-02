import FtpDeploy from 'ftp-deploy';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ftpDeploy = new FtpDeploy();

// Load FTP configuration
const configPath = path.join(__dirname, '.ftp-deploy.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ .ftp-deploy.json not found!');
    console.error('💡 Please create .ftp-deploy.json with your Hostinger FTP credentials');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('🚀 Starting deployment to Hostinger...');
console.log(`📁 Deploying from: ${config.localRoot}`);
console.log(`🌐 Deploying to: ${config.host}${config.remoteRoot}`);

ftpDeploy
    .deploy(config)
    .then(() => {
        console.log('✅ Deployment completed successfully!');
        console.log('🌐 Your site should be live at your domain');
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
