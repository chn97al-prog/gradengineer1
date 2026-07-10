/**
 * كود Google Apps Script — تجهيزات المهندس
 *
 * طريقة التركيب:
 * 1. افتح Google Sheet جديد (هذا هو الشيت يلي رح تتجمع فيه طلبات الطلاب)
 * 2. من القائمة: Extensions > Apps Script
 * 3. احذف الكود الموجود والصق هذا الكود مكانه
 * 4. اضغط Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. انسخ رابط الـ Web App وحطه بمكان GOOGLE_SCRIPT_URL بملف index.html
 *
 * ملاحظة: الصور المرفقة تُحفظ تلقائياً بمجلد Google Drive باسم
 * "تجهيزات المهندس - صور الطلبات" ويُحط رابط كل صورة بعمودها بالشيت.
 */

var IMAGES_FOLDER_NAME = "تجهيزات المهندس - صور الطلبات";

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(IMAGES_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(IMAGES_FOLDER_NAME);
}

function saveImageAndGetLink(folder, imgData, namePrefix) {
  var decoded = Utilities.base64Decode(imgData.base64);
  var mime = imgData.mimeType || "image/jpeg";
  var filename = namePrefix + "_" + (imgData.filename || "image.jpg");
  var blob = Utilities.newBlob(decoded, mime, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function imageLinkFor(images, label, folder, namePrefix) {
  for (var i = 0; i < images.length; i++) {
    if (images[i].label === label) {
      return saveImageAndGetLink(folder, images[i], namePrefix);
    }
  }
  return "";
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var headers = [
    "التاريخ والوقت", "الموديل", "نوع الوشاح (أمريكي فقط)", "الاسم الثلاثي", "الاسم على الوشاح",
    "الكتابة على الظهر", "صورة الكتابة على الظهر",
    "الكتابة على القبعة", "صورة الكتابة على القبعة",
    "الكتابة على جانب القبعة", "صورة الكتابة على جانب القبعة",
    "الطول (سم)", "الكتف (سم)", "محيط الصدر (سم)", "الردن (سم)", "الرأس (سم)",
    "الهاتف"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  var d = data.details || {};
  var images = data.images || [];
  var rawName = d["الاسم الثلاثي"] || "طالب";
  var namePrefix = rawName.replace(/\s+/g, "_");

  var folder = null;
  if (images.length > 0) {
    folder = getOrCreateFolder();
  }

  sheet.appendRow([
    new Date(),
    data.model || "",
    data.sashType || "",
    d["الاسم الثلاثي"] || "",
    d["الاسم على الوشاح"] || "",
    d["الكتابة على الظهر"] || "",
    folder ? imageLinkFor(images, "الكتابة على الظهر", folder, namePrefix) : "",
    d["الكتابة على القبعة"] || "",
    folder ? imageLinkFor(images, "الكتابة على القبعة", folder, namePrefix) : "",
    d["الكتابة على جانب القبعة"] || "",
    folder ? imageLinkFor(images, "الكتابة على جانب القبعة", folder, namePrefix) : "",
    d["الطول (سم)"] || "",
    d["الكتف (سم)"] || "",
    d["محيط الصدر (سم)"] || "",
    d["الردن (سم)"] || "",
    d["الرأس (سم)"] || "",
    data.phone || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

