const { parentPort, workerData } = require('worker_threads');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function parse() {
    try {
        const { buffer, isPDF, isDOCX } = workerData;
        let cleanText = '';
        if (isPDF) {
            const data = await pdfParse(Buffer.from(buffer));
            cleanText = (data && data.text ? data.text : '').trim();
        } else if (isDOCX) {
            const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
            cleanText = (result && result.value ? result.value : '').trim();
        }
        parentPort.postMessage({ success: true, text: cleanText });
    } catch (err) {
        parentPort.postMessage({ success: false, error: err.message });
    }
}

parse();
