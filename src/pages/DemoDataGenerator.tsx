import React, { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DemoDataGenerator() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateDemoData = async () => {
    if (!userProfile) return;
    setLoading(true);
    setSuccess(false);
    
    try {
      // 1. Categories
      const cat1Ref = await addDoc(collection(db, 'categories'), { title: 'Scheme / Chương trình', type: 'main', parentId: null, order: 1 });
      const cat2Ref = await addDoc(collection(db, 'categories'), { title: 'Thông báo triển khai', type: 'main', parentId: null, order: 2 });
      
      const subCat1Ref = await addDoc(collection(db, 'categories'), { title: 'Scheme Tháng', type: 'sub', parentId: cat1Ref.id, order: 1 });

      const now = new Date();
      const in3Days = new Date(); in3Days.setDate(now.getDate() + 3);
      const past2Days = new Date(); past2Days.setDate(now.getDate() - 2);

      // 2. Documents
      await addDoc(collection(db, 'documents'), {
        title: 'Hướng dẫn sử dụng hệ thống CRM',
        description: 'Tài liệu hướng dẫn các bước cơ bản để Sales vận hành và cập nhật báo cáo trên hệ thống CRM mới.',
        categoryId: cat1Ref.id,
        subcategoryId: subCat1Ref.id,
        type: 'pdf',
        tags: ['Hướng dẫn', 'CRM', 'Đào tạo'],
        brand: 'Hệ thống',
        status: 'new',
        publishDate: now.toISOString(),
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Real sample PDF
        authorId: userProfile.id,
        isRequireReadReceipt: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      await addDoc(collection(db, 'documents'), {
        title: 'Scheme Quý 2 - Kênh Nhà Thuốc (OTC)',
        description: 'Chi tiết chương trình khuyến mãi mua 10 tặng 1 áp dụng cho nhãn hàng A.',
        categoryId: cat1Ref.id,
        subcategoryId: subCat1Ref.id,
        type: 'word',
        tags: ['Q2', 'OTC', 'Khuyến Mãi'],
        brand: 'Nhãn A',
        status: 'urgent',
        publishDate: now.toISOString(),
        expireDate: in3Days.toISOString(),
        fileUrl: '', // Clear the broken link
        authorId: userProfile.id,
        isRequireReadReceipt: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      await addDoc(collection(db, 'documents'), {
        title: 'Biểu mẫu báo cáo trả thưởng Tháng 4',
        description: 'File Excel mẫu dùng để Sales nhập trả thưởng cho KH.',
        categoryId: cat2Ref.id,
        subcategoryId: null,
        type: 'excel',
        tags: ['Trả thưởng', 'Tháng 4'],
        status: 'active',
        publishDate: past2Days.toISOString(),
        authorId: userProfile.id,
        createdAt: past2Days.toISOString(),
        updatedAt: past2Days.toISOString(),
      });

      // 3. Tasks
      await addDoc(collection(db, 'tasks'), {
        title: 'Lấy Data Trưng Bày Tủ Kệ - KV1',
        description: 'Chụp hình tủ kệ tại điểm bán và upload lên link driver chung. Cần hoàn thành trước thứ 5.',
        deadline: in3Days.toISOString(),
        status: 'pending',
        priority: 'high',
        assigneeIds: [userProfile.id],
        region: 'KV1',
        documentId: null,
        createdBy: userProfile.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });

      await addDoc(collection(db, 'tasks'), {
        title: 'Ký phục lục hợp đồng với chuỗi N',
        description: 'Mang phụ lục đến ký trực tiếp với chủ chuỗi N.',
        deadline: past2Days.toISOString(),
        status: 'overdue',
        priority: 'high',
        assigneeIds: [userProfile.id],
        createdBy: userProfile.id,
        createdAt: past2Days.toISOString(),
        updatedAt: past2Days.toISOString()
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo dữ liệu: ' + err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 rounded flex items-center justify-center mx-auto shadow-sm border border-rose-200">
          <Database className="w-8 h-8 text-rose-600" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tạo Dữ Liệu Mẫu (Demo)</h1>
          <p className="text-slate-500">
            Tính năng này sẽ tạo ra một loạt các danh mục, tài liệu, và công việc mẫu để bạn có thể xem thử giao diện và luồng hoạt động của hệ thống.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex gap-3 text-left">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <p>Dữ liệu này sẽ được thêm trực tiếp vào database của bạn (Firestore). Nó không xóa dữ liệu cũ, chỉ thêm mới.</p>
        </div>

        {!success ? (
          <button 
             onClick={generateDemoData}
             disabled={loading}
             className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {loading ? 'Đang tạo dữ liệu...' : 'Tiến hành tạo dữ liệu mẫu'}
          </button>
        ) : (
           <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold p-4 bg-emerald-50 rounded-lg border border-emerald-200">
             <CheckCircle2 className="w-5 h-5" /> Đã tạo dữ liệu thành công! Đang chuyển hướng...
           </div>
        )}
      </div>
    </div>
  );
}
