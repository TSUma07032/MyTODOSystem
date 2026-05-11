use tauri::{AppHandle, WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
async fn open_sub_window(app: AppHandle) {
    // 1. 小窓の作成
    // 同一ラベル "sub-window" のウィンドウが既に存在する場合は、作成せずエラーを返します
    let sub_win = WebviewWindowBuilder::new(
        &app,
        "sub-window",
        WebviewUrl::App("index.html#timer".into()) 
    )
    .title("Pomodoro Timer")
    .inner_size(300.0, 200.0)
    .min_inner_size(200.0, 150.0)
    .resizable(true)          
    .always_on_top(true)
    .build();

    if let Ok(w) = sub_win {
        let _ = w.set_focus(); // 新しく開いた場合にフォーカスを当てる
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![open_sub_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
