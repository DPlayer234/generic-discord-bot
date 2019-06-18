const MD_REGEX = /[\_\*\~\|\`\<\>\\]/g;
const MD_ESCAPER = s => '\\' + s;

const AT_REGEX = /\@/g;
const AT_ESCAPER = s => s + '⁣'; // Invisible separator

module.exports = (str) => str.replace(MD_REGEX, MD_ESCAPER).replace(AT_REGEX, AT_ESCAPER);
