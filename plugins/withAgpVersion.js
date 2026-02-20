/**
 * Expo config plugin: ensures root android/build.gradle uses AGP 8.8.2 explicitly.
 * Fixes "No matching variant" / "No variants exist" on EAS Build when prebuild
 * regenerates the android folder without the version, causing autolinked libs to mismatch.
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const AGP_VERSION = '8.8.2';

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
      // Replace any existing version with our pinned one so EAS and local stay in sync
      const withAnyVersion = /classpath\s*\(\s*['"]com\.android\.tools\.build:gradle:[^'"]*['"]\s*\)/;
      if (withAnyVersion.test(contents)) {
        contents = contents.replace(withAnyVersion, withVersion);
      }
    }
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAgpVersion;
