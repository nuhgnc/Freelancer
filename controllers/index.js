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
  //Yeni fotoğraf ekeleyeksek bu kodalrı çalıştır

  if (req.files) {
    const file = req.files.file;
    const fileName = file.md5 + ".jpg";
    const photoPath = "./photos/" + fileName;
    const content = req.body;

    //Güncellemek istediği resim daha önce yüklü değilse resimi güncelle
    fs.exists(photoPath, async (isExists) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }

      // Yüklenilen resim daha önce olan resimlerden farklı ise güncelleştirmeyi yap
      if (!isExists) {
        const updatedPhoto = await Photo.findByIdAndUpdate(req.params.id, {
          name: content.name,
          detail: content.detail,
          photoPath: fileName,
        });

        // databsede ki (yani eski resimi ) resimi sunucu depolamasından siliyor.
        if (fs.existsSync("./photos/" + updatedPhoto.photoPath)) {
          fs.unlink("./photos/" + updatedPhoto.photoPath, (err) => {
            err ? res.send(err) : null;
          });
        }

        // Yeni eklenen dosayı sunucu depolamasına taşı
        fs.exists("./photos/" + updatedPhoto.photoPath, (exist) => {
          if (!exist) {
            file.mv(photoPath, (err) => {
              err ? res.send(err) : null;
            });
          }
        });

        // Kayıt et ve kullanıcıya alert gönder sonra
        updatedPhoto.save();
        req.flash("updated", "updated");
        res.redirect("/#portfolio");
        //Eğer yüklenilen resim daha önce kullanılmışsa kullanıcıyı uyar ve işlem yapma
      } else {
        req.flash("exists", `daha önce yüklenmiş`);
        res.redirect("/#portfolio");
      }
    });
  }
  //Eğer kullanıcı yeni resim yüklmiyorsa sadece text bilgilerini değiştir.
  else {
    const updatedPhoto = await Photo.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      detail: req.body.detail,
    });
    // Kaydet ve kullancııyı bilgilendir
    updatedPhoto.save();
    req.flash("updated", "only texts");
    res.redirect("/#portfolio");
  }
});

router.post("/delete/:id", async (req, res) => {
  const selectedPhoto = await Photo.findById(req.params.id);
  const selectedPhotoPath = "./photos/" + selectedPhoto.photoPath;

  if (fs.existsSync(selectedPhotoPath)) {
    try {
      fs.unlinkSync(selectedPhotoPath);
    } catch (error) {
      res.send(error);
    }
  }

  req.flash("deleted", "Fotoğraf silindi");
  Photo.findByIdAndDelete(req.params.id)
    .then(res.redirect("/#portfolio"))
    .catch((err) => res.send(err));
});

module.exports = router;
