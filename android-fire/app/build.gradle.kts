plugins {
    id("com.android.application")
}

android {
    namespace = "com.bestpolity.switchaccess"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bestpolity.switchaccess"
        minSdk = 22
        targetSdk = 35
        versionCode = 2
        versionName = "0.2.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
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
