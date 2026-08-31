plugins {
    id("com.android.application")
}

android {
    namespace = "com.bestpolity.switchsolitaire"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.bestpolity.switchsolitaire"
        minSdk = 22
        targetSdk = 36
        versionCode = 3
        versionName = "0.3.0"
    }

    buildFeatures {
        buildConfig = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
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
