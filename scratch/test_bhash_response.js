const axios = require('axios');

const user = 'MisCRM';
const pass = '123456';
const sender = 'MisCRM';
const phone = '7974899898';
const otp = '999999';
const template = 'service_rejected_hindi';

const httpsUrl = `https://bhashsms.com/api/sendmsg.php?user=${user}&pass=${pass}&sender=${sender}&phone=${phone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;
const httpUrl = `http://bhashsms.com/api/sendmsg.php?user=${user}&pass=${pass}&sender=${sender}&phone=${phone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;

async function testHttps() {
  console.log('Testing HTTPS Axios...');
  try {
    const res = await axios.get(httpsUrl, { timeout: 15000 });
    console.log('HTTPS Response Success! Data:', res.data);
    console.log('Data type:', typeof res.data);
  } catch (err) {
    console.error('HTTPS Response Error:', err.message);
  }
}

async function testHttp() {
  console.log('Testing HTTP Axios...');
  try {
    const res = await axios.get(httpUrl, { timeout: 15000 });
    console.log('HTTP Response Success! Data:', res.data);
    console.log('Data type:', typeof res.data);
  } catch (err) {
    console.error('HTTP Response Error:', err.message);
  }
}

async function run() {
  await testHttps();
  console.log('-----------------');
  await testHttp();
}

run();
