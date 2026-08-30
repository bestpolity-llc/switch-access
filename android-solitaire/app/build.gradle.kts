plugins {
    id("com.android.application")
}

android {
    namespace = "com.bestpolity.switchsolitaire"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bestpolity.switchsolitaire"
        minSdk = 22
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures {
        buildConfig = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
