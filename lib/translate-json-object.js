var _ = require('lodash');
var Promise = require('bluebird');
var constant = require('./util/constant');
var isValidLang = require('./util/valid-lang');
var SyncPromise = require('sync-promise');

/**
 * TranslateJSONObject - A Node.js module to translate a JSON object from a detectable language to any other language currently via google or yandex translate API
 *
 * @return {Object}  Module API
 */
function TranslateJSONObject() {
	// Set the current available service for translation e.g. google, bing, yandex etc..
	var translateSrv;
	var setting;
	// The list of promises that should be resolve prior to returning the full `Object translation`
	var serviceType;

	/**
	 * init - Initialize the setting of your module instance, it takes a setting object
	 *
	 * @param  {Object} options
	 * @return {boolean} indicate if the module is configured properly
	 */
	function init(options) {


		setting = options || {};


		if (!setting.url && !setting.yandexApiKey && !setting.msKey) {
			console.warn(constant.ERROR.MISSING_TOKEN);
			return false;
		} else if (setting.yandexApiKey) {
			serviceType = constant.YANDEX_NAME;
			translateSrv = require('./service/yandex.js');
		} else if (setting.url) {
			serviceType = constant.GOOGLE_NAME;
			translateSrv = require('./service/google.js');
		} else if (setting.msKey) {
			serviceType = constant.MS_NAME;
			translateSrv = require('./service/microsoft.js');
		}

		translateSrv.init(setting);
		return true;
	}


	function initMap(){
		return translateSrv.initMap();
	}


	/**
	 * translate - Translate an object to any given language, it returns a promise with the translated object
	 *
	 * @param  {Object} srcObj   The object to be translated
	 * @param  {String} languageTo The language you wish to translate too, accept the code e.g 'es', 'fr', 'ar' ...
	 * @param {Array} Optional array of attributes that must not be translated
	 * @return {Promise}         It returns a promise with the translated object
	 */
	function translate(srcObj, languageTo, languageFrom, attributesToNotTranslate) {

		var promises = [];
		var destObj = {};

		if (!setting.url && !setting.yandexApiKey && !setting.msKey) {
			return Promise.reject(constant.ERROR.MISSING_TOKEN);
		}

		if (!attributesToNotTranslate) {
			attributesToNotTranslate = [];
		}

		if (!_.isString(languageTo)) {
			return Promise.reject('Please provide a language param [type String] e.g. translate(obj, es)');
		}

		languageTo = languageTo.toLowerCase().replace("_", "-")
		languageFrom = languageFrom.toLowerCase().replace("_", "-")

		// if (!isValidLang(languageTo, serviceType)) {
		// 	return Promise.reject(serviceType + ' doesn\'t support the language code you specified [' + languageTo + '], please try another language code (ISO-639-1)');
		// }

		var ARRAY_ROOT_TYPE = _.isArray(srcObj);
		if (ARRAY_ROOT_TYPE) {
			srcObj = {
				arrayType: srcObj
			};
		}

		function recurisveTranslateObject(destObj, srcObj) {
			// Loop through the entire object collection
			_.forEach(srcObj, loopHandler);

			function loopHandler(value, key) {
				if (_.isPlainObject(value)) {
					translateObjectProps(value, key, destObj);
				} else if (_.isArray(value)) {
					_.forEach(value, function (value, keyarr) {
						handleArrayType(value, keyarr, destObj[key]);
					});
				}
			}
		}


		/**
		 * @private
		 * @param {*} value value of the key property
		 * @param {*} key key of the object
		 * @param {*} destObj the location of the parent object
		 */
		function handleArrayType(value, key, destObj) {
			if (_.isPlainObject(value)) {
				translateObjectProps(value, key, destObj);
			} else if (_.isString(value) && value !== '') {
				promises.push(translateSrv.string(languageTo, key, destObj, value));
			}
		}

		/**
		 * @private
		 * @param {*} value value of the key property
		 * @param {*} key key of the object
		 * @param {*} destObj the location of the parent object
		 */
		function translateObjectProps(value, key, dest) {
			dest[key] = {};
			_.merge(dest[key], value);
			recurisveTranslateObject(dest[key], value);

			// Find the keys of the current object that has string value (str is translatable)
			var objKeys = _.pickBy(dest[key], function (value, key) {
				return _.isString(value) && value.length > 0 && attributesToNotTranslate.indexOf(key) < 0;
			});

			var keysArray = _.keys(objKeys);
			var valuesArray = _.concat(_.values(objKeys));

			if (valuesArray.length !== 0 && keysArray != null && keysArray.length > 0) {
				promises.push({language: languageTo, languageFrom: languageFrom, key: key, dest: dest, keysArray: keysArray, valuesArray: valuesArray});
			}
		}

		// Recursivly loop through an object
		recurisveTranslateObject(destObj, {
			ROOT: srcObj
		}, languageTo);

		return new Promise(function (resolve, reject) {

			translateSrv.initMap().then(function () {
				Promise.map(promises, function (promise) {
					// Promise.map awaits for returned promises as well.
					return translateSrv.object(promise.language,  promise.languageFrom, promise.key, promise.dest, promise.keysArray, promise.valuesArray)
				}, {concurrency: 25}).then(function (res) {
					if (ARRAY_ROOT_TYPE) {
						resolve(destObj.ROOT.arrayType);
					} else {
						resolve(destObj.ROOT);
					}
				}).catch(error => {

				})
			});
		})

	}

	return {
		init: init,
		translate: translate,
		initMap : initMap
	};
}

module.exports = TranslateJSONObject;
