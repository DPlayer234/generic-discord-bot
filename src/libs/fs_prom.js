const fs = require('fs');

const rr = (resolve, reject) => (err, data) => {
	if (err) reject(err);
	else resolve(data);
};

exports.writeFile = function writeFile(file, data) {
	return new Promise((resolve, reject) => {
		fs.writeFile(file, data, rr(resolve, reject));
	});
};

exports.readFile = function readFile(file) {
	return new Promise((resolve, reject) => {
		fs.readFile(file, rr(resolve, reject));
	});
};

exports.mkdir = function mkdir(path) {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, rr(resolve, reject));
	});
};

exports.readdir = function readdir(path) {
	return new Promise((resolve, reject) => {
		fs.readdir(path, rr(resolve, reject));
	});
};

exports.stat = function stat(path) {
	return new Promise((resolve, reject) => {
		fs.stat(path, rr(resolve, reject));
	});
};
