const ADMIN_WA_NUMBER = process.env.ADMIN_WA_NUMBER || '6289629625458';

export function formatWaMessage(order: {
  orderCode: string;
  authorName: string;
  authorEmail: string;
  authorPhone: string;
  shippingAddress: string;
  bookTitle: string;
  fileOriginalName: string | null;
  pages: number;
  copies: number;
  bookSize: string;
  addons: string[];
  totalPrice: number;
}) {
  const formattedPrice = `Rp ${order.totalPrice.toLocaleString('id-ID')}`;
  const addonsStr = order.addons.length > 0 ? order.addons.join(', ') : '-';

  const text =
`Halo Redaksi Penerbit Novella.id, 
saya ${order.authorName} bermaksud menerbitkan buku. Dengan kode Pesanan: ${order.orderCode} 

Dengan rincian sebagai berikut :
- Nama Penulis: ${order.authorName} 
- Judul Buku: ${order.bookTitle} 
- Estimasi Naskah: ${order.pages} halaman (${order.bookSize}) 
- Jumlah Cetak: ${order.copies} eksemplar 
- Opsi Tambahan: ${addonsStr} 
- Estimasi Biaya: ${formattedPrice} 
- Alamat Pengiriman: ${order.shippingAddress} 

Mohon petunjuk selanjutnya. Terima kasih!`;

  const url = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(text)}`;
  return { text, url };
}
