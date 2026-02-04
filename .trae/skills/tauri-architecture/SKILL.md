---
name: tauri-architecture
description: Design robust Tauri applications with React, TypeScript, and Rust backend. Master Tauri API, IPC communication, security patterns, and cross-platform desktop application architecture. Use when building Tauri apps, designing desktop application architecture, or integrating Rust backend with TypeScript frontend.
---

You are a Tauri architecture expert specializing in building production-ready cross-platform desktop applications with Rust backend and modern web frontend (React + TypeScript).

## Use this skill when

- Designing Tauri application architecture
- Implementing Tauri IPC (Inter-Process Communication)
- Integrating Rust backend with TypeScript/React frontend
- Building cross-platform desktop applications
- Optimizing Tauri app performance and security
- Setting up Tauri project structure and build pipeline

## Do not use this skill when

- Building pure web applications without desktop features
- Working on mobile-only applications
- You need Electron-specific features not available in Tauri

## Core Architecture Principles

### 1. Project Structure
```
tauri-app/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   ├── commands.rs    # Tauri commands
│   │   ├── state.rs       # Application state
│   │   └── lib.rs         # Library modules
│   ├── Cargo.toml
│   └── tauri.conf.json    # Tauri configuration
├── src/                    # Frontend (React + TypeScript)
│   ├── components/
│   ├── hooks/
│   ├── services/          # API layer for Tauri commands
│   ├── types/             # TypeScript types
│   └── App.tsx
├── package.json
└── tsconfig.json
```

### 2. IPC Communication Patterns

**Command Pattern (Frontend → Backend)**
```typescript
// Frontend: src/services/tauri.ts
import { invoke } from '@tauri-apps/api/tauri';

export interface UserData {
  id: string;
  name: string;
}

export async function getUserData(userId: string): Promise<UserData> {
  return await invoke<UserData>('get_user_data', { userId });
}
```

```rust
// Backend: src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserData {
    id: String,
    name: String,
}

#[tauri::command]
pub async fn get_user_data(user_id: String) -> Result<UserData, String> {
    // Implementation
    Ok(UserData {
        id: user_id,
        name: "John Doe".to_string(),
    })
}
```

**Event Pattern (Backend → Frontend)**
```rust
// Backend: Emit events
use tauri::Manager;

pub fn emit_progress(app: &tauri::AppHandle, progress: f64) {
    app.emit_all("progress-update", progress).unwrap();
}
```

```typescript
// Frontend: Listen to events
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<number>('progress-update', (event) => {
    console.log('Progress:', event.payload);
  });
  
  return () => {
    unlisten.then(f => f());
  };
}, []);
```

### 3. State Management

**Rust Backend State**
```rust
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub data: Mutex<HashMap<String, String>>,
}

#[tauri::command]
pub fn update_state(
    state: State<AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let mut data = state.data.lock().unwrap();
    data.insert(key, value);
    Ok(())
}

// In main.rs
fn main() {
    tauri::Builder::default()
        .manage(AppState {
            data: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![update_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend State (React)**
```typescript
// Use React Query for async state management
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserData, updateUserData } from './services/tauri';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserData(userId),
  });
  
  const mutation = useMutation({
    mutationFn: updateUserData,
  });
  
  // Component logic
}
```

### 4. Security Best Practices

**Command Allowlist**
```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "scope": ["$APPDATA/*", "$RESOURCE/*"],
        "readFile": true,
        "writeFile": true
      },
      "shell": {
        "open": true,
        "scope": [
          { "name": "open-url", "cmd": "open", "args": ["https://*"] }
        ]
      }
    }
  }
}
```

**Input Validation**
```rust
#[tauri::command]
pub fn process_file(path: String) -> Result<String, String> {
    // Validate input
    if !path.ends_with(".txt") {
        return Err("Invalid file type".to_string());
    }
    
    // Sanitize path
    let canonical_path = std::fs::canonicalize(&path)
        .map_err(|e| format!("Invalid path: {}", e))?;
    
    // Process file
    Ok("Success".to_string())
}
```

### 5. Error Handling

**Unified Error Type**
```rust
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(String),
    
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

#[tauri::command]
pub async fn read_config() -> Result<Config, AppError> {
    let content = tokio::fs::read_to_string("config.json").await?;
    let config: Config = serde_json::from_str(&content)
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(config)
}
```

**Frontend Error Handling**
```typescript
// src/services/error-handler.ts
export class TauriError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TauriError';
  }
}

export async function handleTauriCommand<T>(
  command: Promise<T>
): Promise<T> {
  try {
    return await command;
  } catch (error) {
    if (typeof error === 'string') {
      throw new TauriError(error);
    }
    throw error;
  }
}
```

### 6. Performance Optimization

**Async Operations**
```rust
// Use async for I/O-bound operations
#[tauri::command]
pub async fn fetch_data(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;
    
    let body = response.text()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(body)
}

// Use blocking for CPU-bound operations
#[tauri::command]
pub async fn process_image(path: String) -> Result<Vec<u8>, String> {
    tokio::task::spawn_blocking(move || {
        // CPU-intensive image processing
        image::open(&path)
            .map_err(|e| e.to_string())?
            .to_bytes()
    })
    .await
    .map_err(|e| e.to_string())?
}
```

**Frontend Optimization**
```typescript
// Debounce frequent Tauri calls
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  async (query: string) => {
    const results = await invoke<SearchResult[]>('search', { query });
    setResults(results);
  },
  300
);

// Batch operations
async function batchProcess(items: string[]) {
  // Process in chunks to avoid blocking
  const chunkSize = 10;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await invoke('process_batch', { items: chunk });
  }
}
```

### 7. File System Operations

```rust
use tauri::api::path::{app_data_dir, resource_dir};
use std::path::PathBuf;

#[tauri::command]
pub async fn save_user_data(
    app: tauri::AppHandle,
    data: String,
) -> Result<(), String> {
    let app_data = app_data_dir(&app.config())
        .ok_or("Failed to get app data dir")?;
    
    let file_path = app_data.join("user_data.json");
    
    tokio::fs::write(file_path, data)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

### 8. Window Management

```typescript
// src/services/window.ts
import { appWindow, WebviewWindow } from '@tauri-apps/api/window';

export async function createSettingsWindow() {
  const settingsWindow = new WebviewWindow('settings', {
    url: '/settings',
    title: 'Settings',
    width: 600,
    height: 400,
    resizable: false,
  });
  
  await settingsWindow.once('tauri://created', () => {
    console.log('Settings window created');
  });
}

export async function minimizeToTray() {
  await appWindow.hide();
}
```

### 9. System Tray Integration

```rust
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};
use tauri::Manager;

pub fn create_system_tray() -> SystemTray {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(quit);
    
    SystemTray::new().with_menu(tray_menu)
}

pub fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            }
        }
        _ => {}
    }
}
```

### 10. Build and Distribution

**Development**
```bash
# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

**Configuration for Multiple Platforms**
```json
// tauri.conf.json
{
  "tauri": {
    "bundle": {
      "identifier": "com.example.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "targets": ["dmg", "msi", "deb", "appimage"],
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      },
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.13"
      }
    }
  }
}
```

## Testing Strategy

### Rust Backend Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_get_user_data() {
        let result = get_user_data("123".to_string()).await;
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.id, "123");
    }
}
```

### Frontend Tests
```typescript
// src/components/__tests__/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { mockIPC } from '@tauri-apps/api/mocks';
import UserProfile from '../UserProfile';

test('loads and displays user data', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'get_user_data') {
      return { id: '123', name: 'John Doe' };
    }
  });
  
  render(<UserProfile userId="123" />);
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Behavioral Traits
- Separates concerns between Rust backend and TypeScript frontend
- Uses type-safe IPC communication with proper error handling
- Implements security best practices with allowlists and validation
- Optimizes performance with async operations and batching
- Follows Tauri conventions and community best practices
- Provides comprehensive error messages for debugging
- Tests both backend and frontend components
- Documents IPC contracts and data structures
- Considers cross-platform compatibility
- Minimizes bundle size and startup time

## Common Patterns

### Database Integration (SQLite)
```rust
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use tauri::State;

pub struct DbState {
    pub pool: SqlitePool,
}

#[tauri::command]
pub async fn query_users(
    db: State<'_, DbState>
) -> Result<Vec<User>, String> {
    sqlx::query_as::<_, User>("SELECT * FROM users")
        .fetch_all(&db.pool)
        .await
        .map_err(|e| e.to_string())
}
```

### HTTP Client
```rust
use reqwest::Client;

#[tauri::command]
pub async fn fetch_api_data(url: String) -> Result<serde_json::Value, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    response
        .json()
        .await
        .map_err(|e| e.to_string())
}
```

### Auto-updater
```rust
use tauri::updater::UpdaterBuilder;

pub async fn check_for_updates(app: tauri::AppHandle) {
    let updater = UpdaterBuilder::new()
        .build(&app)
        .await
        .unwrap();
    
    if let Some(update) = updater.check().await.unwrap() {
        update.download_and_install().await.unwrap();
    }
}
```

## Resources
- Official Tauri Documentation: https://tauri.app/
- Tauri API Reference: https://tauri.app/v1/api/js/
- Rust Backend Patterns: Use rust-pro skill
- TypeScript Frontend Patterns: Use typescript-pro skill
- React Integration: https://tauri.app/v1/guides/getting-started/setup/react

## Integration with Other Skills
- Use `rust-pro` for advanced Rust backend implementation
- Use `typescript-pro` for complex TypeScript type systems
- Use `rust-async-patterns` for async Rust operations
- Use `software-architecture` for overall application design
- Use `test-driven-development` for testing strategy