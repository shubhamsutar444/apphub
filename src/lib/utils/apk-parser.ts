import JSZip from "jszip";

/**
 * Extracts all readable strings from Android Binary XML (AXML) String Pool.
 */
function extractAxmlStrings(buffer: ArrayBuffer): string[] {
  const data = new DataView(buffer);
  const strings: string[] = [];

  try {
    if (buffer.byteLength < 16) return [];

    // Search for String Pool Chunk Type (0x0001 or 0x001C0001)
    let offset = 0;
    while (offset < data.byteLength - 8) {
      const type = data.getUint16(offset, true);
      if (type === 0x0001) break;
      const chunkSize = data.getUint32(offset + 4, true);
      if (chunkSize <= 0 || offset + chunkSize > data.byteLength) {
        offset += 4;
      } else {
        offset += chunkSize;
      }
    }

    if (offset >= data.byteLength - 8) return [];

    const stringCount = data.getUint32(offset + 8, true);
    const flags = data.getUint32(offset + 16, true);
    const isUtf8 = (flags & 0x0100) !== 0;
    const stringsStart = offset + data.getUint32(offset + 20, true);

    const stringOffsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
      const idxOffset = offset + 28 + i * 4;
      if (idxOffset + 4 <= data.byteLength) {
        stringOffsets.push(data.getUint32(idxOffset, true));
      }
    }

    for (let i = 0; i < stringOffsets.length; i++) {
      const strOffset = stringsStart + stringOffsets[i];
      if (strOffset >= data.byteLength - 2) continue;

      if (isUtf8) {
        let strPos = strOffset;
        const charLen = data.getUint8(strPos);
        strPos += 1;
        if (charLen & 0x80) strPos += 1;
        const byteLen = data.getUint8(strPos);
        strPos += 1;
        if (byteLen & 0x80) strPos += 1;

        if (strPos + byteLen <= data.byteLength) {
          const bytes = new Uint8Array(buffer, strPos, byteLen);
          const str = new TextDecoder("utf-8").decode(bytes);
          if (str) strings.push(str);
        }
      } else {
        const charLen = data.getUint16(strOffset, true);
        const strPos = strOffset + 2;
        const byteLen = charLen * 2;
        if (strPos + byteLen <= data.byteLength) {
          const bytes = new Uint8Array(buffer, strPos, byteLen);
          const str = new TextDecoder("utf-16le").decode(bytes);
          if (str) strings.push(str);
        }
      }
    }
  } catch (e) {
    console.warn("AXML parse warning:", e);
  }

  return strings;
}

/**
 * Parses an APK file (File or ArrayBuffer or Buffer) and extracts its Android Package Name.
 */
export async function extractApkPackageName(apkInput: File | ArrayBuffer | Buffer): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(apkInput);
    const manifestEntry = zip.file("AndroidManifest.xml");
    if (!manifestEntry) return null;

    const manifestBuffer = await manifestEntry.async("arraybuffer");
    const strings = extractAxmlStrings(manifestBuffer);

    // Package names follow reverse domain notation e.g. com.example.myapp
    const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

    const candidates = strings.filter(
      (s) =>
        s.length >= 5 &&
        s.length <= 120 &&
        s.includes(".") &&
        !s.startsWith("android.") &&
        !s.startsWith("schemas.") &&
        !s.startsWith("http://") &&
        !s.startsWith("https://") &&
        !s.endsWith(".xml") &&
        !s.endsWith(".png") &&
        !s.endsWith(".jpg") &&
        packageNameRegex.test(s)
    );

    if (candidates.length > 0) {
      // Prioritize common app package prefixes (com.*, org.*, in.*, net.*, app.*, dev.*, etc.)
      const topMatch = candidates.find((c) =>
        /^(com|org|net|in|io|app|dev|me|co|uk|de|fr|tech|ai)\.[a-zA-Z0-9_]+/i.test(c)
      );
      return topMatch || candidates[0];
    }
  } catch (err) {
    console.error("Failed to parse APK package name:", err);
  }

  return null;
}
