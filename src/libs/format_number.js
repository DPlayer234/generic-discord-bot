function formatNumber(num, l, c = '0') {
	num = num.toString();
	return num.length >= l
		? num
		: `${c.repeat(l - num.length)}${num}`;
}

formatNumber.as2 = function formatNumberAs2(num, c = '0') {
	num = num.toString();
	if (num.length < 2) return c + num;
	return num;
};

module.exports = formatNumber;
