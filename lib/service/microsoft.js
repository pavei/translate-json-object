var MsTranslator = require('mstranslator');

var Promise = require('promise');
var _ = require('lodash');
var SyncPromise = require('sync-promise');
var translateService;

function init(setting) {
	translateService =  new MsTranslator({
		api_key: setting.msKey
	}, false);

	translateService.initialize_token(function(err, keys) {
		console.log(keys);

	})


}

// eslint-disable-next-line max-params
function translateObject(language, key, destObj, keysArray, valuesArray) {
	return new Promise(function (resolve, reject) {

		let params = {
			from: "pt-br",
			to: language,
			texts : valuesArray
		}

		console.log(params);
		translateService.translateArray(params, function (err, res) {
			if (err || !res) {


				reject(err);
			} else {
				// Google-translate doesn't return an array if we only send a single string to translate
				res = _.concat(res);
				for (var i = 0; i < keysArray.length; i++) {

					destObj[key][keysArray[i]] =  res[i] ? res[i].TranslatedText : ""
				}

				resolve(destObj);
			}
		});
	});
}

function translateString(language, key, destObj, valueStr) {
	return new Promise(function (resolve, reject) {
		let params = {
			from: "pt-br",
			to: language,
			text : valueStr
		}

		translateService.translate(params, function (err, res) {
			if (err || !res) {
				reject(err);
			} else {
				destObj[key] = res;
				resolve(destObj);
			}
		});
	});
}

module.exports = {
	init: init,
	object: translateObject,
	string: translateString
};


