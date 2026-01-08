#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::info;

fn main() {
    // Initialize Logger
    // Default level is 'info', can be overridden by RUST_LOG env var
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Metrix Studio Backend starting...");

    // Handover execution to the library crate
    metrix_studio_lib::run();
}