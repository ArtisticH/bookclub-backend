const fs = require('fs-extra');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../uploads');

async function deleteUploads(filesToDelete) {
  try {
    const files = await fs.readdir(targetDir);
    for (const file of files) {
      if (filesToDelete.includes(file)) {
        const filePath = path.join(targetDir, file);
        await fs.remove(filePath);
        console.log(`${file}가 성공적으로 삭제되었습니다.`);
      }
    }
  } catch (err) {
    console.error('파일 삭제 중 오류 발생:', err);
  }
}
// 현재 파일이 있는 폴더, 이동할 폴더, 움직일 파일들
module.exports = async (sourceDir, destinationDir, filesToMove) => {
  try {
    const files = await fs.readdir(sourceDir);
    for (const file of files) {
      if (filesToMove.includes(file)) {
        const sourceFile = path.join(sourceDir, file);
        const destinationFile = path.join(destinationDir, file);
        // 파일을 이동 (fs-extra의 move 메서드는 Promise를 반환)
        await fs.move(sourceFile, destinationFile);
        console.log(`${file}가 성공적으로 이동되었습니다.`);
      }
    }
    await deleteUploads(filesToMove);
  } catch(err) {
    console.error('파일 이동 중 오류 발생:', err);
  }
}
