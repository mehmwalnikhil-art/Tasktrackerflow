# Test the AI Task Parser

Open browser console (F12) to see AI parsing in action!

## Test Cases

### 1. Email Tasks
**Input:** `Write an email to PwC for preparation of TP documentation, add details as to fee, deadline etc.`
**Expected:**
- Title: "Email to PwC"
- Description: "Regarding: Preparation of TP documentation, add details as to fee, deadline etc."

**Input:** `Send email to John about project update`
**Expected:**
- Title: "Email to John"
- Description: "Regarding: Project update"

### 2. Call Tasks
**Input:** `Call Sarah about quarterly review meeting`
**Expected:**
- Title: "Call Sarah"
- Description: "About: Quarterly review meeting"

**Input:** `Call client for budget discussion`
**Expected:**
- Title: "Call Client"
- Description: "About: Budget discussion"

### 3. Prepare Tasks
**Input:** `Prepare presentation for board meeting, include financial data`
**Expected:**
- Title: "Prepare Presentation"
- Description: "For: Board meeting. Include financial data"

### 4. Meeting Tasks
**Input:** `Meeting with team about sprint planning`
**Expected:**
- Title: "Meeting with Team"
- Description: "Topic: Sprint planning"

### 5. Comma/Semicolon Split
**Input:** `Review contract, check terms and conditions`
**Expected:**
- Title: "Review contract"
- Description: "Check terms and conditions"

**Input:** `Update documentation; add new features`
**Expected:**
- Title: "Update documentation"
- Description: "Add new features"

### 6. Generic "for" keyword
**Input:** `Create report for management`
**Expected:**
- Title: "Create report"
- Description: "For: Management"

### 7. Simple tasks (no description)
**Input:** `Fix bug in login page`
**Expected:**
- Title: "Fix bug in login page"
- Description: ""

## Reminder Countdown Test

1. Create any task
2. Click ⏰ button
3. Enter "1" (for 1 minute)
4. Watch the countdown update every second:
   - Shows "1m 0s", "0m 59s", "0m 58s"...
   - Turns orange when < 1 minute
   - Shows "NOW!" in red when time is up
   - Notification popup appears

## Deadline Test

1. Create task with deadline set to 6 minutes from now
2. Wait 1 minute
3. You'll get notification: "⏰ Deadline Soon! Due in 5 minutes"
4. Wait 6 minutes total
5. You'll get notification: "🚨 Deadline Passed!"

## Check Console
Every time you create a task, console shows:
```
Parsing input: [your text]
Matched: [pattern name]
AI Parsed: {name: "...", description: "..."}
```
