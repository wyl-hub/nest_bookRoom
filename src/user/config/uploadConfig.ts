import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export default {
  limits: {
    fileSize: 1024 * 50,
  },
  fileFilter: (_req, file: Express.Multer.File, cb) => {
    if (file.mimetype.match(/(jpg|jpeg|png|gif)/)) {
      return cb(null, true);
    } else {
      return cb(new BadRequestException('文件格式错误'), false);
    }
  },
  storage: diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => {
      const uniqueSuffix =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        '-' +
        file.originalname;
      cb(null, uniqueSuffix);
    },
  }),
};
