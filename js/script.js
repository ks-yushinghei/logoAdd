let uploadedPdf = null;
let modifiedPdf = null;
let originalFileName = ""; 

document.getElementById("pdf-upload").addEventListener("change", async (event) => {
	const file = event.target.files[0];
	if (file && file.type === "application/pdf") {
		// 元のファイル名を保存
		originalFileName = file.name.replace(".pdf", "");
		
	    const arrayBuffer = await file.arrayBuffer();
		uploadedPdf = await PDFLib.PDFDocument.load(arrayBuffer);
		const pdfBytes = await uploadedPdf.save();
		const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
		const pdfUrl = URL.createObjectURL(pdfBlob);
		document.getElementById("pdf-viewer").src = pdfUrl;
	} else {
		alert("PDFファイルをアップロードしてください");
	}
});

// 画像選択ボタンの処理
document.getElementById('logo-upload').addEventListener('change', function(event) {
    const file = event.target.files[0]; // 選択されたファイル
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            uploadedImageUrl = e.target.result; // Base64データURLを保持
        }

        reader.readAsDataURL(file); // 画像をBase64形式で読み込む
    }
});

// ロゴ追加処理
document.getElementById("add-logo-btn").addEventListener("click", async () => {
	if (!uploadedPdf) {
		alert("PDFをアップロードしてください");
		return;
	}

	if(!uploadedImageUrl){
		alert("ロゴをアップロードしてください");
		return;
	}
	
	const newPdf = await PDFLib.PDFDocument.load(await uploadedPdf.save());
        
    // 画像URLを作成
	const logoUrl = uploadedImageUrl;
	
	const getImageDimensions = async (url) => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				resolve({ imgWidth: img.naturalWidth, imgHeight: img.naturalHeight });
			};
			img.onerror = (err) => reject(err);
			img.src = url;
		});
	};
	
	const { imgWidth: logoWidth, imgHeight: logoHeight } = await getImageDimensions(logoUrl);
	
	// ロゴ画像をBase64形式で読み込む
	const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
	const logoImage = await newPdf.embedPng(logoImageBytes);
	
	// ロゴの位置を選択
	const logoPosition = document.getElementById("logo-position").value;
	
	// ロゴのサイズを選択
	const showHeight = document.getElementById("logo-size").value;

	if(!showHeight){
		alert("ロゴの高さを入力してください");
		return;
	}
	
	const ratio = showHeight / logoHeight;
	
	const showWidth = logoWidth * ratio;
	
	const logoMargin = document.getElementById("logo-margin").value;

	if(!logoMargin){
		alert("余白を入力してください");
		return;
	}
	
	// PDFの全ページにロゴを追加
	const pages = newPdf.getPages();
	for (let i = 0; i < pages.length; i++) {
		const page = pages[i];
		const { width, height } = page.getSize();
		
		let x, y;
		
		// ロゴの位置を選択に応じて決定
		switch (logoPosition) {
			case "top-left":
				x = logoMargin;
				y = height - showHeight - logoMargin;
				break;
				
			case "top-right":
				x = width - showWidth - logoMargin;
				y = height - showHeight - logoMargin;
				break;
				
			case "bottom-left":
				x = logoMargin;
				y = logoMargin;
				break;
				
			case "bottom-right":
				x = width - showWidth - logoMargin;
				y = logoMargin;
				break;
			default:
				x = logoMargin;
				y = height - logoHeight - logoMargin;
		}
		
		page.drawImage(logoImage, {
			x: parseInt(x),
			y: parseInt(y),
			width: parseInt(showWidth),
			height: parseInt(showHeight)
		});
	}
	
	// 編集後のPDFを保存
	modifiedPdf = newPdf;
	
	// ダウンロードボタンを表示
	document.getElementById("download-btn").style.display = "inline-block";
	
	// 更新したPDFを表示
	await updatePdfViewer(modifiedPdf);
});

// PDF表示の更新を行う関数
async function updatePdfViewer(pdfDocument) {
	const pdfBytes = await pdfDocument.save();
	const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
	const pdfUrl = URL.createObjectURL(pdfBlob);
	
	// PDFビューアを更新
	const pdfViewer = document.getElementById("pdf-viewer");
	pdfViewer.src = pdfUrl;
}

// ダウンロードボタンの処理
document.getElementById("download-btn").addEventListener("click", async () => {
	if (!modifiedPdf) {
		alert("PDFを編集してください");
		return;
	}
	
	const pdfBytes = await modifiedPdf.save();
	const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
	const pdfUrl = URL.createObjectURL(pdfBlob);
	
	// 元のファイル名に "_ロゴ付き" を追加した名前でダウンロード
	const downloadLink = document.createElement("a");
	downloadLink.href = pdfUrl;
	downloadLink.download = `${originalFileName}_ロゴ付き.pdf`;
	downloadLink.click();
});

