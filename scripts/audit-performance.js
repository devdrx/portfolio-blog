import fs from 'fs';
import { execSync, spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to wait for the local preview server to start
function waitPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

// Format score color
function getScoreColor(score) {
  if (score >= 0.9) return '\x1b[32m'; // Green
  if (score >= 0.5) return '\x1b[33m'; // Yellow/Orange
  return '\x1b[31m'; // Red
}

// Format metric color
function getMetricColor(score) {
  if (score >= 0.9) return '\x1b[32m[PASSED]\x1b[0m';
  if (score >= 0.5) return '\x1b[33m[WARNING]\x1b[0m';
  return '\x1b[31m[FAILED]\x1b[0m';
}

(async () => {
  const targetUrl = process.argv[2];
  let previewProcess = null;
  let chrome = null;
  let urlToAudit = targetUrl;
  const port = 4173;

  try {
    if (!urlToAudit) {
      console.log('\x1b[36m%s\x1b[0m', 'No target URL provided. Initiating local production audit...');
      
      // 1. Build the application
      console.log('Running production build (npm run build)...');
      execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      
      // 2. Start the preview server
      console.log(`Starting Vite preview server on port ${port}...`);
      previewProcess = spawn('npx', ['vite', 'preview', '--port', String(port)], {
        cwd: path.join(__dirname, '..'),
        shell: true
      });
      
      // Handle server logs
      previewProcess.stdout.on('data', (data) => {
        const text = data.toString();
        if (text.includes('Local:')) {
          console.log(text.trim());
        }
      });

      // Wait for port to become active
      await waitPort(port);
      urlToAudit = `http://localhost:${port}/?noboot`;
      console.log(`\x1b[32mPreview server is ready at ${urlToAudit}\x1b[0m\n`);
    } else {
      console.log('\x1b[36m%s\x1b[0m', `Auditing specified target URL: ${urlToAudit}`);
    }

    // 3. Launch headless Chrome
    console.log('Launching headless Chrome for performance capture...');
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });

    const options = {
      logLevel: 'silent',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    // 4. Run Lighthouse audit
    console.log(`Running Lighthouse audit on ${urlToAudit}...`);
    const runnerResult = await lighthouse(urlToAudit, options);
    
    // Save report to disk for reference
    const reportPath = path.join(__dirname, '..', 'lighthouse_console_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));

    const lhr = runnerResult.lhr;
    const score = lhr.categories.performance.score;
    const scorePct = Math.round(score * 100);
    const scoreColor = getScoreColor(score);
    
    let rating = 'POOR';
    if (score >= 0.9) rating = 'EXCELLENT';
    else if (score >= 0.5) rating = 'NEEDS IMPROVEMENT';

    // 5. Output beautiful YoRHa Performance status report
    console.log('\n\x1b[1m==================================================');
    console.log(`        [ YoRHa PERFORMANCE STATUS REPORT ]`);
    console.log('==================================================\x1b[0m');
    console.log(`Target URL:  ${urlToAudit}`);
    console.log(`Date:        ${new Date().toLocaleString()}`);
    console.log('--------------------------------------------------');
    console.log(`OVERALL PERFORMANCE SCORE: ${scoreColor}${scorePct}% [${rating}]\x1b[0m`);
    console.log('--------------------------------------------------');
    console.log('\x1b[1mMETRIC SUMMARY:\x1b[0m');

    const metrics = [
      { id: 'first-contentful-paint', label: 'First Contentful Paint (FCP)' },
      { id: 'largest-contentful-paint', label: 'Largest Contentful Paint (LCP)' },
      { id: 'total-blocking-time', label: 'Total Blocking Time (TBT)' },
      { id: 'speed-index', label: 'Speed Index (SI)' },
      { id: 'cumulative-layout-shift', label: 'Cumulative Layout Shift (CLS)' },
      { id: 'interactive', label: 'Time to Interactive (TTI)' }
    ];

    metrics.forEach(({ id, label }) => {
      const audit = lhr.audits[id];
      if (audit) {
        const value = audit.displayValue || `${audit.numericValue.toFixed(1)} ms`;
        const scoreVal = audit.score !== null ? audit.score : 0;
        const colorIndicator = getMetricColor(scoreVal);
        console.log(`- ${label.padEnd(30)}: ${value.padEnd(10)} ${colorIndicator}`);
      }
    });

    console.log('--------------------------------------------------');
    console.log('\x1b[1mSUGGESTED OPPORTUNITIES & DIAGNOSTICS:\x1b[0m');

    let recommendationCount = 0;
    Object.entries(lhr.audits).forEach(([id, audit]) => {
      if (audit.score !== null && audit.score < 0.9) {
        const details = audit.details;
        let savingsText = '';
        
        if (details?.overallSavingsMs !== undefined) {
          savingsText = ` (Estimated Savings: ~${(details.overallSavingsMs / 1000).toFixed(2)}s)`;
        } else if (details?.overallSavingsBytes !== undefined) {
          savingsText = ` (Estimated Savings: ~${(details.overallSavingsBytes / 1024).toFixed(1)} KB)`;
        }

        if (audit.title && (details?.type === 'opportunity' || details?.type === 'diagnostic' || audit.score < 0.5)) {
          recommendationCount++;
          console.log(`\n\x1b[33m${recommendationCount}. ${audit.title}\x1b[0m\x1b[1m${savingsText}\x1b[0m`);
          console.log(`   ${audit.description.replace(/\[Learn more\]\(.*?\)\.?/g, '').trim()}`);
        }
      }
    });

    if (recommendationCount === 0) {
      console.log('\x1b[32mNo major issues found! Your application is fully optimized.\x1b[0m');
    }

    console.log('\x1b[1m==================================================\x1b[0m');
    console.log(`Full report details saved to: ${reportPath}\n`);

  } catch (error) {
    console.error('\x1b[31mError during performance audit:\x1b[0m', error);
  } finally {
    // Kill Chrome here (not on the success path) so it isn't orphaned when
    // lighthouse throws between launch and the end of the try block.
    if (chrome) {
      await chrome.kill().catch(() => {});
    }
    if (previewProcess) {
      console.log('Shutting down local preview server...');
      previewProcess.kill();
    }
    process.exit(0);
  }
})();
