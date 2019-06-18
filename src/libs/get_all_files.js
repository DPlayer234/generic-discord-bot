/*
Fetches all files in a directory and its subdirectories.
*/
const fs = require('fs');
const path = require('path');
const fsProm = require('./fs_prom');

module.exports = function getAllFiles(dir, files = []) {
	const filesInDir = fs.readdirSync(dir)
		.map(file => path.join(dir, file));

	filesInDir.forEach((file) => {
		const stats = fs.statSync(file);
		if (stats.isDirectory()) {
			getAllFiles(file, files);
		}
		else if (stats.isFile()) {
			files.push(file);
		}
	});

	return files;
};

module.exports.async = async function getAllFiles_async(dir, files = []) {
	const filesInDir = (await fsProm.readdir(dir))
		.map(file => path.join(dir, file));

	await Promise.all(filesInDir.map(async (file) => {
		const stats = await fsProm.stat(file);
		if (stats.isDirectory()) {
			await getAllFiles_async(file, files);
		}
		else if (stats.isFile()) {
			files.push(file);
		}
	}));

	return files;
};
