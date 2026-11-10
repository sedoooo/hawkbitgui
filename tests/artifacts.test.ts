import { describe, expect, test } from 'bun:test';
import { buildArtifactDownloadPath, formatArtifactSize, sanitizeArtifactFilename } from '../src/utils/artifacts';

describe('buildArtifactDownloadPath', () => {
  test('builds the server-side streaming download route for an artifact', () => {
    expect(buildArtifactDownloadPath(128, 138)).toBe('/api/softwaremodules/128/artifacts/138/download');
  });
});

describe('formatArtifactSize', () => {
  test('formats bytes, kilobytes and megabytes with raw byte counts', () => {
    expect(formatArtifactSize(512)).toBe('512 B');
    expect(formatArtifactSize(907872)).toBe('887 KB (907,872 B)');
    expect(formatArtifactSize(76262073)).toBe('72.7 MB (76,262,073 B)');
  });

  test('handles missing or invalid sizes', () => {
    expect(formatArtifactSize(undefined)).toBe('Unknown size');
    expect(formatArtifactSize(null)).toBe('Unknown size');
    expect(formatArtifactSize(-1)).toBe('Unknown size');
  });
});

describe('sanitizeArtifactFilename', () => {
  test('strips header-breaking and path characters', () => {
    expect(sanitizeArtifactFilename('dongle.pkg')).toBe('dongle.pkg');
    expect(sanitizeArtifactFilename('evil"\r\nname.pkg')).toBe('evilname.pkg');
    expect(sanitizeArtifactFilename('../../etc/passwd')).toBe('.._.._etc_passwd');
  });

  test('falls back when the filename is empty', () => {
    expect(sanitizeArtifactFilename(undefined)).toBe('artifact.bin');
    expect(sanitizeArtifactFilename('   ')).toBe('artifact.bin');
  });
});
