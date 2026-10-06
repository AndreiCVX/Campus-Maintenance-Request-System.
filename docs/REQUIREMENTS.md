# Requirements Document: Campus Maintenance Request System

Team: [Team name]
Members: [Member 1], [Member 2], [Member 3]
Course: [Course code], Midterm Project, Round 1

## 1. Problem Statement

Right now, a broken light, a leaking faucet or a jammed classroom door usually gets reported by word of mouth, a text to a friend in the facilities office, or a paper note that may or may not reach anyone. Nobody can say who reported what, whether anyone is working on it, or how long it has been sitting there.

The Campus Maintenance Request System gives students, faculty and staff one place to report a problem, and gives the facilities office one place to assign the work, track it and close it.

## 2. Users

| User | Description | What they need |
|---|---|---|
| Requester | A student, faculty member or staff member who notices a problem | Submit a request quickly, see its status, edit or cancel it while it is still unassigned |
| Maintenance staff | Technician or janitorial staff who does the repair | See only the jobs assigned to them, update progress, add notes, mark work done |
| Administrator | Facilities coordinator | See all requests, assign them, change priority, manage user accounts, view summary reports |

## 3. Stakeholders

| Stakeholder | Interest in the system |
|---|---|
| Facilities / Physical Plant Office | Owns the repair workload and wants less chasing of verbal reports |
| Students | Affected by broken facilities in classrooms, dorms and restrooms |
| Faculty and department heads | Need classrooms and labs usable, want to know when a fix is expected |
| Campus security and safety officer | Cares about hazards such as broken locks, exposed wiring and slippery floors being handled first |
| Finance / budget office | Wants a record of how much maintenance work is happening and where |
| IT office | Maintains the server and accounts the system runs on |
| Course instructor | Evaluates the project against the midterm rubric |

## 4. Functional Requirements

### Accounts and access
- FR-1: A new user can register with name, school email, and password.
- FR-2: A registered user can log in and log out. Sessions expire after a period of inactivity.
- FR-3: Every user has exactly one role: requester, maintenance, or admin.
- FR-4: Pages and actions are restricted by role. Typing a restricted URL directly must not bypass this.
- FR-5: An admin can view, create, deactivate and change the role of user accounts.

### Requests
- FR-6: A requester can submit a request with title, description, category (electrical, plumbing, furniture, HVAC, cleaning, other), building, room, and urgency (low, medium, high).
- FR-7: A requester can view a list of their own requests and open the details of each.
- FR-8: A requester can edit or cancel a request only while its status is Pending.
- FR-9: Admins can view all requests, and can search and filter by status, category, building and urgency.
- FR-10: An admin can assign a request to one maintenance staff member and set its priority.
- FR-11: Maintenance staff can view only requests assigned to them.
- FR-12: Maintenance staff can move an assigned request through In Progress and Completed, and add a note at each step.
- FR-13: Every status change is recorded with who made it and when.
- FR-14: Admins can reopen a Completed request if the problem comes back.

### Reports
- FR-15: The admin dashboard shows counts of requests by status, plus a list of the oldest unresolved requests.
- FR-16: The admin can view a summary by category and by building.

### Validation
- FR-17: All form input is validated on the server before it is stored. Required fields, email format, password length, text length limits, and allowed values for category, urgency and status are all checked.
- FR-18: Duplicate emails are rejected at registration.
- FR-19: Validation failures show a specific message next to the field and keep what the user already typed.

## 5. Non-Functional Requirements

- NFR-1 Security: Passwords are stored as bcrypt hashes, never as plain text. Secrets live in `.env`, which is not committed.
- NFR-2 Security: All database queries use parameterized statements to prevent SQL injection. User-supplied text is escaped when rendered.
- NFR-3 Usability: A requester can submit a request in under two minutes on a phone-sized screen. Pages are responsive.
- NFR-4 Performance: List and dashboard pages load in under 2 seconds with up to 1,000 stored requests.
- NFR-5 Reliability: Data persists across page refreshes and server restarts.
- NFR-6 Maintainability: Code is organized into routes, controllers, models, middleware and views so each member can work on a separate area without constant merge conflicts.
- NFR-7 Portability: The system runs on any machine with Node.js and MySQL by following the README.
- NFR-8 Accessibility: Forms have labels, and status is never shown by color alone.

## 6. Use Cases

### UC-1: Register and log in
- Actor: Requester
- Precondition: User has no account
- Steps:
  1. User opens the registration page and enters name, email and password.
  2. System validates the input and creates the account with the requester role.
  3. User logs in with the new credentials.
- Expected result: User lands on their own dashboard. A wrong password or empty fields shows an error and no session is created.

### UC-2: Submit a maintenance request
- Actor: Requester
- Precondition: Logged in as a requester
- Steps:
  1. User clicks "New request".
  2. User fills in title, description, category, building, room and urgency.
  3. User submits the form.
- Expected result: The request is stored with status Pending and appears in "My requests". Invalid or missing fields are rejected with messages.

### UC-3: Assign a request
- Actor: Administrator
- Precondition: Logged in as admin, at least one Pending request exists
- Steps:
  1. Admin opens the all-requests page and filters by Pending.
  2. Admin opens a request.
  3. Admin chooses a maintenance staff member and a priority, then saves.
- Expected result: Status becomes Assigned, the technician sees it in their list, and the change is logged.

### UC-4: Work on and complete a request
- Actor: Maintenance staff
- Precondition: Logged in as maintenance, a request is assigned to them
- Steps:
  1. Technician opens "My assigned jobs".
  2. Technician opens a request and sets it to In Progress with a note.
  3. After the repair, technician sets it to Completed with a closing note.
- Expected result: The requester sees the new status and notes. The technician cannot open requests assigned to someone else.

### UC-5: Edit or cancel a pending request
- Actor: Requester
- Precondition: The requester owns a request with status Pending
- Steps:
  1. User opens the request from "My requests".
  2. User edits the details or clicks Cancel.
- Expected result: Changes are saved or the request becomes Cancelled. Once the request has been assigned, the edit and cancel options are no longer available.

### UC-6: Attempt to reach a restricted page
- Actor: Any logged-in or anonymous user
- Precondition: User lacks permission for the page
- Steps:
  1. User types an admin URL such as `/admin/users` directly into the browser.
- Expected result: An anonymous user is redirected to login. A logged-in non-admin sees a 403 page. No data is shown in either case.

### UC-7: Manage users
- Actor: Administrator
- Precondition: Logged in as admin
- Steps:
  1. Admin opens the user management page.
  2. Admin creates a maintenance account, changes a role, or deactivates an account.
- Expected result: The change is stored. A deactivated user can no longer log in.

## 7. Out of Scope (Round 1)

Email or SMS notifications, photo uploads, inventory of parts, and integration with the school's existing student information system.
