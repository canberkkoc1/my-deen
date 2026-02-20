/**
 * Expo config plugin: ensures root android/build.gradle uses AGP 8.8.2 and
 * forces subprojects to use the same AGP. Fixes "No variants exist" on EAS Build.
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const AGP_VERSION = '8.8.2';

const SUBPROJECTS_BLOCK = `

// Force all subprojects (autolinked libs) to use the same AGP so "No variants exist" is avoided on EAS Build
subprojects { subproject ->
  subproject.buildscript {
    repositories {
      google()
      mavenCentral()
    }
    dependencies {
      classpath('com.android.tools.build:gradle:${AGP_VERSION}')
    }
  }
}
`;

function withAgpVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }
    let contents = config.modResults.contents;
    // Ensure classpath('com.android.tools.build:gradle') has explicit version
    const withoutVersion = /classpath\s*\(\s*['"]com\.android\.tools\.build:gradle['"]\s*\)/;
    const withVersion = `classpath('com.android.tools.build:gradle:${AGP_VERSION}')`;
    if (withoutVersion.test(contents)) {
      contents = contents.replace(withoutVersion, withVersion);
    } else {
      const withAnyVersion = /classpath\s*\(\s*['"]com\.android\.tools\.build:gradle:[^'"]*['"]\s*\)/;
      if (withAnyVersion.test(contents)) {
        contents = contents.replace(withAnyVersion, withVersion);
      }
    }
    // Ensure subprojects block exists so EAS prebuild gets it too
    if (!contents.includes('Force all subprojects')) {
      contents = contents.trimEnd() + SUBPROJECTS_BLOCK + '\n';
    }
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAgpVersion;
