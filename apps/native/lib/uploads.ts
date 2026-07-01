import * as DocumentPicker from "expo-document-picker";

export type PickedFile = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
};

export async function pickResourceFile(): Promise<PickedFile | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset) {
      return null;
    }

    return {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    };
  } catch (error) {
    console.warn("Document picker failed", error);
    return null;
  }
}

function inferContentType(file: PickedFile): string {
  if (file.mimeType) {
    return file.mimeType;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "mp4":
      return "video/mp4";
    case "mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

export async function uploadFile(
  file: PickedFile,
  generateUploadUrl: () => Promise<string>,
): Promise<string> {
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const contentType = inferContentType(file);

  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!result.ok) {
    const text = await result.text().catch(() => "");
    throw new Error(
      `Upload failed (${result.status} ${result.statusText})${text ? `: ${text}` : ""}`,
    );
  }

  const json = (await result.json()) as { storageId?: string };
  if (!json.storageId) {
    throw new Error("Upload succeeded but no storageId was returned.");
  }
  return json.storageId;
}
