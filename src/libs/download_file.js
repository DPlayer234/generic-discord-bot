const http = require('http');
const https = require('https');

const { URL } = require('url');

const protocols = {
	'http:': http,
	'https:': https
};

module.exports = async function downloadFile(urlStr) {
	const url = new URL(urlStr);
	if (!protocols.hasOwnProperty(url.protocol)) throw new Error(`Unsupported protocol ${url.protocol}`);

	const protocol = protocols[url.protocol];
	const rawData = [];

	return new Promise((resolve, reject) => {
		protocol.get(url, (res) => {
			res.on('data', (data) => rawData.push(data));
			res.on('end', () => resolve(Buffer.concat(rawData)));
		}).on('error', reject);
	});
};
