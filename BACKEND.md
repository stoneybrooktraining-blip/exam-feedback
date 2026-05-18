# Exam Feedback Backend

The live survey posts JSON to a Google Apps Script web app, which should write to the `ASPEQ Feedback` Google Sheet:

https://docs.google.com/spreadsheets/d/1JGiHeLi0BEG1EUkyPRhTE5YP05W2IaIA0d8-wJMLGhE

The backend script source is kept in `apps-script.js` so the receiver is version-controlled with the form.

## Deployment Notes

1. Open the Apps Script project behind the current deployment URL.
2. Replace the server code with `apps-script.js`.
3. Run `setupAll()` once from Apps Script to confirm the `Submissions` and `Questions` headers.
4. Deploy a new web-app version with access that allows anonymous student submissions.
5. Keep the existing deployment URL in `index.html`, or update the URL if Google creates a new deployment.
6. Submit a labelled test response, then confirm:
   - one row appears in `Submissions`
   - one row per reported issue appears in `Questions`
   - `Review Status` defaults to `New`
   - `Priority` is populated
   - the dashboard counts update

## Data Shape

The form currently sends:

```json
{
  "licence": "PPL",
  "subject": "PPL Subject 8 Meteorology",
  "examDate": "2026-05-18",
  "result": "Pass",
  "kdrCodes": "8.2.2",
  "questions": [
    {
      "number": 1,
      "topic": "Cloud formation",
      "issueType": "Different wording or terminology",
      "phrasing": "Student description without copying the ASPEQ question.",
      "correct": "Not sure",
      "confidence": "Medium",
      "helped": "More examples using NZ wording."
    }
  ],
  "other": "General comments"
}
```

The Sheet should be treated as the operational review queue. `Questions` is the main working tab; `Submissions` keeps one row per student submission.
