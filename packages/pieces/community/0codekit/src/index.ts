import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { entityDetectionAction } from './lib/actions/ai/entity-detection';
import { languageDetectionAction } from './lib/actions/ai/language-detection';
import { moodDetectionAction } from './lib/actions/ai/mood-detection';
import { pictureObjectRecognitionAction } from './lib/actions/ai/picture-object-recognition';
import { pictureTextRecognitionAction } from './lib/actions/ai/picture-text-recognition';
import { translateTextAction } from './lib/actions/ai/translate-text';
import { lookupVatRatesAction } from './lib/actions/business/lookup-vat-rates';
import { validateBicAction } from './lib/actions/business/validate-bic';
import { validateEmailAction } from './lib/actions/business/validate-email';
import { validateIbanAction } from './lib/actions/business/validate-iban';
import { validateVatIdAction } from './lib/actions/business/validate-vat-id';
import { validateVatWithCountryCodeAction } from './lib/actions/business/validate-vat-with-country-code';
import { verifyDomainAction } from './lib/actions/business/verify-domain';
import { calculateBmiAction } from './lib/actions/calculate/calculate-bmi';
import { calculateGeoDistanceAction } from './lib/actions/calculate/calculate-geo-distance';
import { runJavascriptCodeAction } from './lib/actions/code/run-javascript-code';
import { runPythonCodeAction } from './lib/actions/code/run-python-code';
import { convertCsvToJsonAction } from './lib/actions/convert/convert-csv-to-json';
import { convertCurrencyAction } from './lib/actions/convert/convert-currency';
import { convertIpToGeoAction } from './lib/actions/convert/convert-ip-to-geo';
import { convertIsoToNationAction } from './lib/actions/convert/convert-iso-to-nation';
import { convertNationToIsoAction } from './lib/actions/convert/convert-nation-to-iso';
import { cryptoDecryptAction } from './lib/actions/crypto/crypto-decrypt';
import { cryptoEncryptAction } from './lib/actions/crypto/crypto-encrypt';
import { cryptoHashAction } from './lib/actions/crypto/crypto-hash';
import { convertTimezoneWithDateAction } from './lib/actions/date-and-time/convert-timezone-with-date';
import { convertTimezoneWithUnixTimestampAction } from './lib/actions/date-and-time/convert-timezone-with-unix-timestamp';
import { currentMonthAction } from './lib/actions/date-and-time/current-month';
import { currentWeekAction } from './lib/actions/date-and-time/current-week';
import { currentWeekFromDateAction } from './lib/actions/date-and-time/current-week-from-date';
import { currentWeekFromUnixTimestampAction } from './lib/actions/date-and-time/current-week-from-unix-timestamp';
import { currentWeekWithWeekNumberAction } from './lib/actions/date-and-time/current-week-with-week-number';
import { currentWeekWithWeekNumberAndYearAction } from './lib/actions/date-and-time/current-week-with-week-number-and-year';
import { getHolidaysAction } from './lib/actions/date-and-time/get-holidays';
import { isWeekendAction } from './lib/actions/date-and-time/is-weekend';
import { isWeekendWithFormatAction } from './lib/actions/date-and-time/is-weekend-with-format';
import { specificMonthAndYearAction } from './lib/actions/date-and-time/specific-month-and-year';
import { getANumberAction } from './lib/actions/generate/get-a-number';
import { getRandomCityAction } from './lib/actions/generate/get-random-city';
import { getRandomNameAction } from './lib/actions/generate/get-random-name';
import { getRandomNameWithGenderAction } from './lib/actions/generate/get-random-name-with-gender';
import { decodeQrCodeAction } from './lib/actions/image/decode-qr-code';
import { generateQrCodeAction } from './lib/actions/image/generate-qr-code';
import { imageExifAction } from './lib/actions/image/image-exif';
import { createPdfFromHtmlAction } from './lib/actions/pdf/create-pdf-from-html';
import { createPdfFromUrlAction } from './lib/actions/pdf/create-pdf-from-url';
import { getPdfPageCountAction } from './lib/actions/pdf/get-pdf-page-count';
import { mergePdfsAction } from './lib/actions/pdf/merge-pdfs';
import { splitPdfAction } from './lib/actions/pdf/split-pdf';
import { createASchedulerAction } from './lib/actions/scheduler/create-a-scheduler';
import { deleteASchedulerAction } from './lib/actions/scheduler/delete-a-scheduler';
import { listSchedulersAction } from './lib/actions/scheduler/list-schedulers';
import { addAGlobalVariableAction } from './lib/actions/storage/add-a-global-variable';
import { addAPermFileAction } from './lib/actions/storage/add-a-perm-file';
import { deleteAGlobalVariableAction } from './lib/actions/storage/delete-a-global-variable';
import { deleteAPermFileAction } from './lib/actions/storage/delete-a-perm-file';
import { getAGlobalVariableAction } from './lib/actions/storage/get-a-global-variable';
import { getAPermFileAction } from './lib/actions/storage/get-a-perm-file';
import { listGlobalVariablesAction } from './lib/actions/storage/list-global-variables';
import { listPermFilesAction } from './lib/actions/storage/list-perm-files';
import { addTemporaryFileAction } from './lib/actions/temp-file/add-temporary-file';
import { detectGenderAction } from './lib/actions/text/detect-gender';
import { splitNameAction } from './lib/actions/text/split-name';
import { textContainsAction } from './lib/actions/text/text-contains';
import { advancedSwitchWithUrlAction } from './lib/actions/url/advanced-switch-with-url';
import { createCustomShortenedUrlAction } from './lib/actions/url/create-custom-shortened-url';
import { createShortenedUrlAction } from './lib/actions/url/create-shortened-url';
import { deleteShortenedUrlAction } from './lib/actions/url/delete-shortened-url';
import { getAShortenedUrlAction } from './lib/actions/url/get-a-shortened-url';
import { listShortenedUrlsAction } from './lib/actions/url/list-shortened-urls';
import { updateShortenedUrlAction } from './lib/actions/url/update-shortened-url';
import { urlExpanderAction } from './lib/actions/url/url-expander';
import { utmBuildAction } from './lib/actions/url/utm-build';
import { utmParseAction } from './lib/actions/url/utm-parse';
import { zeroCodeKitAuth } from './lib/auth';
import { ZEROCODEKIT_BASE_URL, zeroCodeKitApi } from './lib/common/client';

export const zeroCodeKit = createPiece({
    displayName: '0CodeKit',
    description:
        'Ready-made utilities for automations: dates and calendar weeks, conversions, validation, PDF and QR tools, file storage, AI text and image analysis, code execution, crypto and short links.',
    minimumSupportedRelease: '0.82.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/0codekit.png',
    categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.PRODUCTIVITY],
    auth: zeroCodeKitAuth,
    authors: ['OdaiAhmed99'],
    actions: [
        currentMonthAction,
        specificMonthAndYearAction,
        currentWeekAction,
        currentWeekFromDateAction,
        currentWeekFromUnixTimestampAction,
        currentWeekWithWeekNumberAction,
        currentWeekWithWeekNumberAndYearAction,
        isWeekendAction,
        isWeekendWithFormatAction,
        getHolidaysAction,
        convertTimezoneWithDateAction,
        convertTimezoneWithUnixTimestampAction,
        convertCsvToJsonAction,
        convertCurrencyAction,
        convertIpToGeoAction,
        convertIsoToNationAction,
        convertNationToIsoAction,
        calculateBmiAction,
        calculateGeoDistanceAction,
        validateBicAction,
        validateEmailAction,
        validateIbanAction,
        validateVatWithCountryCodeAction,
        validateVatIdAction,
        lookupVatRatesAction,
        verifyDomainAction,
        detectGenderAction,
        splitNameAction,
        textContainsAction,
        getRandomCityAction,
        getRandomNameAction,
        getRandomNameWithGenderAction,
        getANumberAction,
        getPdfPageCountAction,
        createPdfFromHtmlAction,
        createPdfFromUrlAction,
        mergePdfsAction,
        splitPdfAction,
        generateQrCodeAction,
        decodeQrCodeAction,
        imageExifAction,
        addTemporaryFileAction,
        addAGlobalVariableAction,
        getAGlobalVariableAction,
        deleteAGlobalVariableAction,
        listGlobalVariablesAction,
        addAPermFileAction,
        getAPermFileAction,
        deleteAPermFileAction,
        listPermFilesAction,
        entityDetectionAction,
        languageDetectionAction,
        moodDetectionAction,
        pictureObjectRecognitionAction,
        pictureTextRecognitionAction,
        translateTextAction,
        runJavascriptCodeAction,
        runPythonCodeAction,
        cryptoDecryptAction,
        cryptoEncryptAction,
        cryptoHashAction,
        createASchedulerAction,
        deleteASchedulerAction,
        listSchedulersAction,
        advancedSwitchWithUrlAction,
        createCustomShortenedUrlAction,
        createShortenedUrlAction,
        deleteShortenedUrlAction,
        getAShortenedUrlAction,
        listShortenedUrlsAction,
        updateShortenedUrlAction,
        urlExpanderAction,
        utmBuildAction,
        utmParseAction,
        createCustomApiCallAction({
            baseUrl: () => ZEROCODEKIT_BASE_URL,
            auth: zeroCodeKitAuth,
            authMapping: async (auth, propsValue) => {
                zeroCodeKitApi.assertProviderUrl(propsValue['url']?.['url']);
                return { auth: auth.secret_text };
            },
        }),
    ],
    triggers: [],
});
