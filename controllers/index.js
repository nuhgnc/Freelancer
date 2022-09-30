const express = require("express");
const Photo = require("../model/Photo");
const fs = require("fs");

const router = express.Router();

router.get("/", async (req, res) => {
  const allPhotos = await Photo.find({});

  res.render("index", { allPhotos, message: req.flash("info") });
});

router.post("/add", async (req, res) => {
  // Fotoğraf kaydetme kod bloğu
  const file = req.files.file;
  const fileName = file.md5 + ".jpg";
  const photoPath = "./photos/" + fileName;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  fs.exists(photoPath, (isExists) => {
    if (!isExists) {
      file.mv(photoPath, (err) => (err ? console.log(err) : null));

      // Fotoğraf metin içeriği database'e kayıt etme
      const content = req.body;
      const newPhoto = new Photo({
        name: content.name,
        detail: content.detail,
        photoPath: fileName,
      });
      newPhoto.save();
      req.flash("added", "Fotoğraf ekendi");
      res.redirect("/#portfolio");
    } else {
      req.flash("exists", `daha önce yüklenmiş`);
      res.redirect("/#portfolio");
    }
  });
});

router.post("/update/:id", async (req, res) => {
  const file = req.files.file;
  const fileName = file.md5 + ".jpg";
  const photoPath = "./photos/" + fileName;
  const content = req.body;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  //Güncellemek istediği resim daha önce yüklü değilse resimi güncelle
  fs.exists(photoPath, async (isExists) => {
    if (!isExists) {
      file.mv(photoPath, (err) => (err ? console.log(err) : null));
      const updatedPhoto = await Photo.findByIdAndUpdate(req.params.id, {
        name: content.name,
        detail: content.detail,
        photoPath: fileName,
      });

      // databsede ki (yani eski resimi ) resimin url'sini sunucu depolamasından siliyor.
      if (fs.existsSync("./photos/" + updatedPhoto.photoPath)) {
        fs.unlinkSync("./photos/" + updatedPhoto.photoPath, (err) =>
          err ? console.log(err) : console.log("silindi")
        );
      }
      // yeni eklenen resimi sunucu depolamasına taşıyor
      file.mv(photoPath, (err) =>
        err ? console.log(err) : console.log("dosya taşındı")
      );
      // Kayıt et ve kullanıcıya alert gönder sonra
      updatedPhoto.save();
      req.flash("updated", "updated");

      res.redirect("/#portfolio");
    } else {
      req.flash("exists", `daha önce yüklenmiş`);
      res.redirect("/#portfolio");
    }
  });
});

router.post("/delete/:id", async (req, res) => {
  const selectedPhoto = await Photo.findById(req.params.id);
  const selectedPhotoPath = "./photos/" + selectedPhoto.photoPath;

  if (fs.existsSync(selectedPhotoPath)) {
    fs.unlinkSync(selectedPhotoPath, (err) =>
      err ? console.log(err) : console.log("silindi")
    );
  }

  Photo.findByIdAndDelete(req.params.id)
    .then(console.log("databaseden silindi"))
    .catch((err) => console.log(err));
  req.flash("deleted", "Fotoğraf silindi");
  res.redirect("/#portfolio");
});

module.exports = router;
