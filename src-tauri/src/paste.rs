// Auto-paste — Windows SendInput API 직접 호출.
// PowerShell 우회로 즉시 반응 (~5ms vs PowerShell ~300ms).

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL,
};

#[cfg(target_os = "windows")]
const VK_V: u16 = 0x56;

#[tauri::command]
pub fn auto_paste() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            let inputs: [INPUT; 4] = [
                // Ctrl down
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_CONTROL,
                            wScan: 0,
                            dwFlags: 0,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // V down
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_V,
                            wScan: 0,
                            dwFlags: 0,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // V up
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_V,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // Ctrl up
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_CONTROL,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
            ];

            let sent = SendInput(
                inputs.len() as u32,
                inputs.as_ptr(),
                std::mem::size_of::<INPUT>() as i32,
            );

            if sent != 4 {
                return Err(format!(
                    "SendInput sent {} of 4 events (last error may indicate UIPI block)",
                    sent
                ));
            }
        }
        Ok("pasted via SendInput".into())
    }

    #[cfg(not(target_os = "windows"))]
    Err("non-Windows not supported".into())
}

/// Tauri command — Rust 측에서 직접 클립보드 set.
/// frontend 의 navigator.clipboard.writeText 가 hide/focus 문제로 NotAllowedError 던질 때 우회용.
#[tauri::command]
pub fn set_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;
    let mut clip = Clipboard::new().map_err(|e| format!("clipboard init: {e}"))?;
    clip.set_text(text).map_err(|e| format!("clipboard set: {e}"))?;
    Ok(())
}
