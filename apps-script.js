const SPREADSHEET_ID = '1JGiHeLi0BEG1EUkyPRhTE5YP05W2IaIA0d8-wJMLGhE';
const SUBMISSIONS_SHEET = 'Submissions';
const QUESTIONS_SHEET = 'Questions';

const SUBMISSIONS_HEADERS = [
  'Submission ID',
  'Submitted',
  'Licence',
  'Subject',
  'Exam Date',
  'Result',
  'KDR Codes / Weak Area',
  'Questions Reported',
  'General Comments',
  'Source',
  'Raw Payload',
  'Review Status',
  'Reviewed By',
  'Review Notes'
];

const QUESTIONS_HEADERS = [
  'Submission ID',
  'Submitted',
  'Licence',
  'Subject',
  'Exam Date',
  'Result',
  'KDR Codes / Weak Area',
  'Question #',
  'Topic',
  'Issue Type',
  'Exam Wording / Phrasing',
  'Got It Right',
  'Memory Confidence',
  'What Would Have Helped',
  'Review Status',
  'Action Needed',
  'ADS Issue',
  'JSON Issue',
  'Diagram Issue',
  'Priority',
  'Assigned To',
  'Notes',
  'Last Reviewed'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    app: 'Stoneybrook exam feedback receiver',
    sheets: [SUBMISSIONS_SHEET, QUESTIONS_SHEET]
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const now = new Date();
    const submissionId = makeSubmissionId_();
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const submissionsSheet = ensureSheet_(ss, SUBMISSIONS_SHEET, SUBMISSIONS_HEADERS);
    const questionsSheet = ensureSheet_(ss, QUESTIONS_SHEET, QUESTIONS_HEADERS);

    submissionsSheet.appendRow([
      submissionId,
      now,
      text_(payload.licence),
      text_(payload.subject),
      text_(payload.examDate),
      text_(payload.result),
      text_(payload.kdrCodes),
      questions.length,
      text_(payload.other),
      'exam-feedback',
      JSON.stringify(payload),
      'New',
      '',
      ''
    ]);

    if (questions.length > 0) {
      const rows = questions.map((question, index) => {
        const priority = suggestPriority_(payload, question);
        return [
          submissionId,
          now,
          text_(payload.licence),
          text_(payload.subject),
          text_(payload.examDate),
          text_(payload.result),
          text_(payload.kdrCodes),
          question.number || index + 1,
          text_(question.topic),
          text_(question.issueType),
          text_(question.phrasing),
          text_(question.correct),
          text_(question.confidence),
          text_(question.helped),
          'New',
          '',
          '',
          '',
          '',
          priority,
          '',
          '',
          ''
        ];
      });
      questionsSheet
        .getRange(questionsSheet.getLastRow() + 1, 1, rows.length, QUESTIONS_HEADERS.length)
        .setValues(rows);
    }

    return jsonResponse_({
      ok: true,
      submissionId,
      questionsReported: questions.length
    });
  } catch (err) {
    console.error(err);
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function setupFeedbackBackend() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureSheet_(ss, SUBMISSIONS_SHEET, SUBMISSIONS_HEADERS);
  ensureSheet_(ss, QUESTIONS_SHEET, QUESTIONS_HEADERS);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing POST body.');
  }
  return JSON.parse(e.postData.contents);
}

function ensureSheet_(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const hasDifferentHeaders = headers.some((header, index) => currentHeaders[index] !== header);

  if (hasDifferentHeaders) {
    headerRange.setValues([headers]);
    headerRange
      .setFontWeight('bold')
      .setBackground('#1f2528')
      .setFontColor('#ffffff')
      .setWrap(true);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function suggestPriority_(payload, question) {
  const issueType = text_(question.issueType).toLowerCase();
  const confidence = text_(question.confidence).toLowerCase();
  const correct = text_(question.correct).toLowerCase();
  const result = text_(payload.result).toLowerCase();

  if (
    issueType.includes('answer/content disagreement') ||
    issueType.includes('not covered') ||
    (confidence === 'high' && (correct === 'no' || result === 'fail'))
  ) {
    return 'High';
  }

  if (confidence === 'medium' || correct === 'no' || result === 'fail') {
    return 'Medium';
  }

  return 'Low';
}

function makeSubmissionId_() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return 'SFB-' + Utilities.formatDate(new Date(), 'Pacific/Auckland', 'yyyyMMdd-HHmmss') + '-' + random;
}

function text_(value) {
  return value == null ? '' : String(value);
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
