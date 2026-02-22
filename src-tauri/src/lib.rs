use tauri::menu::{MenuBuilder, SubmenuBuilder, HELP_SUBMENU_ID};
use tauri::Emitter;

#[tauri::command]
async fn print_page(webview_window: tauri::WebviewWindow) -> Result<(), String> {
    webview_window.print().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Remove the default empty Help submenu if present
            if let Some(existing_menu) = app.menu() {
                if let Some(help_item) = existing_menu.get(HELP_SUBMENU_ID) {
                    let _ = existing_menu.remove(&help_item);
                }
            }

            // Build custom Help submenu with a "Help" item
            let help_menu = SubmenuBuilder::new(app, "Help")
                .text("open-help", "Help")
                .build()?;

            // Append to existing menu or create a new one
            if let Some(existing_menu) = app.menu() {
                existing_menu.append(&help_menu)?;
            } else {
                let menu = MenuBuilder::new(app)
                    .items(&[&help_menu])
                    .build()?;
                app.set_menu(menu)?;
            }

            // Emit event to frontend when Help menu item is clicked
            app.on_menu_event(move |app_handle, event| {
                if event.id().as_ref() == "open-help" {
                    let _ = app_handle.emit("open-help", ());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![print_page])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
