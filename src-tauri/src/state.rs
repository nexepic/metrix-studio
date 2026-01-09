use crate::driver::MetrixDB;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Option<MetrixDB>>,
}