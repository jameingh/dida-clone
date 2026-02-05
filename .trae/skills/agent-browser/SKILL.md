---
name: agent-browser
description: "Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to \"open a website\", \"fill out a form\", \"click a button\", \"take a screenshot\", \"scrape data from a page\", \"test this web app\", \"login to a site\", \"automate browser actions\", or any task requiring programmatic web interaction."
---

# Browser Automation with agent-browser

## Core Workflow

Every browser automation follows this pattern:

1. **Navigate**: `agent-browser --cdp 9222 open <url>`
2. **Snapshot**: `agent-browser --cdp 9222 snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser --cdp 9222 open https://example.com/form
agent-browser --cdp 9222 snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser --cdp 9222 fill @e1 "user@example.com"
agent-browser --cdp 9222 fill @e2 "password123"
agent-browser --cdp 9222 click @e3
agent-browser --cdp 9222 wait --load networkidle
agent-browser --cdp 9222 snapshot -i  # Check result
```

## Essential Commands

```bash
# Navigation
agent-browser --cdp 9222 open <url>              # Navigate (aliases: goto, navigate)
agent-browser --cdp 9222 close                   # Close browser

# Snapshot
agent-browser --cdp 9222 snapshot -i             # Interactive elements with refs (recommended)
agent-browser --cdp 9222 snapshot -s "#selector" # Scope to CSS selector

# Interaction (use @refs from snapshot)
agent-browser --cdp 9222 click @e1               # Click element
agent-browser --cdp 9222 fill @e2 "text"         # Clear and type text
agent-browser --cdp 9222 type @e2 "text"         # Type without clearing
agent-browser --cdp 9222 select @e1 "option"     # Select dropdown option
agent-browser --cdp 9222 check @e1               # Check checkbox
agent-browser --cdp 9222 press Enter             # Press key
agent-browser --cdp 9222 scroll down 500         # Scroll page

# Get information
agent-browser --cdp 9222 get text @e1            # Get element text
agent-browser --cdp 9222 get url                 # Get current URL
agent-browser --cdp 9222 get title               # Get page title

# Wait
agent-browser --cdp 9222 wait @e1                # Wait for element
agent-browser --cdp 9222 wait --load networkidle # Wait for network idle
agent-browser --cdp 9222 wait --url "**/page"    # Wait for URL pattern
agent-browser --cdp 9222 wait 2000               # Wait milliseconds

# Capture
agent-browser --cdp 9222 screenshot              # Screenshot to temp dir
agent-browser --cdp 9222 screenshot --full       # Full page screenshot
agent-browser --cdp 9222 pdf output.pdf          # Save as PDF
```

## Common Patterns

### Form Submission

```bash
agent-browser --cdp 9222 open https://example.com/signup
agent-browser --cdp 9222 snapshot -i
agent-browser --cdp 9222 fill @e1 "Jane Doe"
agent-browser --cdp 9222 fill @e2 "jane@example.com"
agent-browser --cdp 9222 select @e3 "California"
agent-browser --cdp 9222 check @e4
agent-browser --cdp 9222 click @e5
agent-browser --cdp 9222 wait --load networkidle
```

### Authentication with State Persistence

```bash
# Login once and save state
agent-browser --cdp 9222 open https://app.example.com/login
agent-browser --cdp 9222 snapshot -i
agent-browser --cdp 9222 fill @e1 "$USERNAME"
agent-browser --cdp 9222 fill @e2 "$PASSWORD"
agent-browser --cdp 9222 click @e3
agent-browser --cdp 9222 wait --url "**/dashboard"
agent-browser --cdp 9222 state save auth.json

# Reuse in future sessions
agent-browser --cdp 9222 state load auth.json
agent-browser --cdp 9222 open https://app.example.com/dashboard
```

### Data Extraction

```bash
agent-browser --cdp 9222 open https://example.com/products
agent-browser --cdp 9222 snapshot -i
agent-browser --cdp 9222 get text @e5           # Get specific element text
agent-browser --cdp 9222 get text body > page.txt  # Get all page text

# JSON output for parsing
agent-browser --cdp 9222 snapshot -i --json
agent-browser --cdp 9222 get text @e1 --json
```

### Parallel Sessions

```bash
agent-browser --cdp 9222 --session site1 open https://site-a.com
agent-browser --cdp 9222 --session site2 open https://site-b.com

agent-browser --cdp 9222 --session site1 snapshot -i
agent-browser --cdp 9222 --session site2 snapshot -i

agent-browser --cdp 9222 session list
```

### Visual Browser (Debugging)

```bash
agent-browser --cdp 9222 --headed open https://example.com
agent-browser --cdp 9222 highlight @e1          # Highlight element
agent-browser --cdp 9222 record start demo.webm # Record session
```

### iOS Simulator (Mobile Safari)

```bash
# List available iOS simulators
agent-browser --cdp 9222 device list

# Launch Safari on a specific device
agent-browser --cdp 9222 -p ios --device "iPhone 16 Pro" open https://example.com

# Same workflow as desktop - snapshot, interact, re-snapshot
agent-browser --cdp 9222 -p ios snapshot -i
agent-browser --cdp 9222 -p ios tap @e1          # Tap (alias for click)
agent-browser --cdp 9222 -p ios fill @e2 "text"
agent-browser --cdp 9222 -p ios swipe up         # Mobile-specific gesture

# Take screenshot
agent-browser --cdp 9222 -p ios screenshot mobile.png

# Close session (shuts down simulator)
agent-browser --cdp 9222 -p ios close
```

**Requirements:** macOS with Xcode, Appium (`npm install -g appium && appium driver install xcuitest`)

**Real devices:** Works with physical iOS devices if pre-configured. Use `--device "<UDID>"` where UDID is from `xcrun xctrace list devices`.

## Ref Lifecycle (Important)

Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes. Always re-snapshot after:

- Clicking links or buttons that navigate
- Form submissions
- Dynamic content loading (dropdowns, modals)

```bash
agent-browser --cdp 9222 click @e5              # Navigates to new page
agent-browser --cdp 9222 snapshot -i            # MUST re-snapshot
agent-browser --cdp 9222 click @e1              # Use new refs
```

## Semantic Locators (Alternative to Refs)

When refs are unavailable or unreliable, use semantic locators:

```bash
agent-browser --cdp 9222 find text "Sign In" click
agent-browser --cdp 9222 find label "Email" fill "user@test.com"
agent-browser --cdp 9222 find role button click --name "Submit"
agent-browser --cdp 9222 find placeholder "Search" type "query"
agent-browser --cdp 9222 find testid "submit-btn" click
```

## Deep-Dive Documentation

| Reference | When to Use |
|-----------|-------------|
| [references/commands.md](references/commands.md) | Full command reference with all options |
| [references/snapshot-refs.md](references/snapshot-refs.md) | Ref lifecycle, invalidation rules, troubleshooting |
| [references/session-management.md](references/session-management.md) | Parallel sessions, state persistence, concurrent scraping |
| [references/authentication.md](references/authentication.md) | Login flows, OAuth, 2FA handling, state reuse |
| [references/video-recording.md](references/video-recording.md) | Recording workflows for debugging and documentation |
| [references/proxy-support.md](references/proxy-support.md) | Proxy configuration, geo-testing, rotating proxies |

## Ready-to-Use Templates

| Template | Description |
|----------|-------------|
| [templates/form-automation.sh](templates/form-automation.sh) | Form filling with validation |
| [templates/authenticated-session.sh](templates/authenticated-session.sh) | Login once, reuse state |
| [templates/capture-workflow.sh](templates/capture-workflow.sh) | Content extraction with screenshots |

```bash
./templates/form-automation.sh https://example.com/form
./templates/authenticated-session.sh https://app.example.com/login
./templates/capture-workflow.sh https://example.com ./output
```