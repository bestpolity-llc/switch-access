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
        versionCode = 1
        versionName = "0.1.0"
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
