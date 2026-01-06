// src-tauri/build.rs
use std::env;
use std::path::PathBuf;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let base_path = PathBuf::from(manifest_dir);

    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();

    // Paths
    let metrix_root = base_path.join("vendor").join("metrix");
    let lib_dir = metrix_root.join("lib");
    let include_dir = metrix_root.join("include");
    let header_file = include_dir.join("metrix").join("metrix_c_api.h");

    // --- Validation ---
    if !lib_dir.exists() {
        panic!("Library dir not found: {}", lib_dir.display());
    }

    // Canonicalize paths (Absolute paths are safer for the linker)
    let lib_dir_abs = lib_dir.canonicalize().expect("Cannot resolve lib dir");
    let header_file_abs = header_file.canonicalize().expect("Cannot resolve header");

    // --- Linker Configuration ---

    // 1. Tell linker where to find libraries (for build time)
    println!("cargo:rustc-link-search=native={}", lib_dir_abs.display());

    match target_os.as_str() {
        "macos" => {
            let dylib_path = lib_dir_abs.join("libmetrix.dylib");

            // 2. Link against the specific file
            // Note: Using full path here forces cargo to verify existence
            println!("cargo:rustc-link-arg={}", dylib_path.display());

            // A. For Production (@loader_path means relative to the binary)
            println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");

            // B. For Development (cargo run)
            // We interpret @rpath as the absolute path to your vendor folder
            println!("cargo:rustc-link-arg=-Wl,-rpath,{}", lib_dir_abs.display());
        }
        "linux" => {
            println!("cargo:rustc-link-lib=dylib=metrix");
            println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
            println!("cargo:rustc-link-arg=-Wl,-rpath,{}", lib_dir_abs.display());
        }
        "windows" => {
            println!("cargo:rustc-link-lib=metrix");
        }
        _ => panic!("Unsupported OS: {}", target_os),
    }

    // --- Bindgen Configuration ---
    println!("cargo:rerun-if-changed={}", header_file_abs.display());

    let bindings = bindgen::Builder::default()
        .header(header_file_abs.to_str().expect("Invalid header path"))
        .clang_arg("-xc++")
        .clang_arg("-std=c++20")
        .clang_arg(format!("-I{}", include_dir.display()))
        .allowlist_type("MetrixDB_T")
        .allowlist_type("MetrixResult_T")
        .allowlist_function("metrix_.*")
        .allowlist_var("MX_.*")
        // Generate proper Rust enums instead of const integers
        .default_enum_style(bindgen::EnumVariation::Rust { non_exhaustive: false })
        // Remove "MetrixValueType_" prefix from variants
        // This means inside the enum, it will just be MX_NODE, not MetrixValueType_MX_NODE
        .prepend_enum_name(false)
        .generate()
        .expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");

    tauri_build::build();
}
