
import React, { useState } from 'react';
// FIX: Correct import paths
import { Category } from '../../../shared/types/index';
import { TrashIcon, PlusIcon, TagIcon } from '../../../shared/components/Icons';

interface CategoryManagerProps {
    categories: Category[];
    addCategory: (name: string) => void;
    deleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, addCategory, deleteCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
        }
    };
    
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">إدارة الفئات</h2>
            <form onSubmit={handleAddCategory} className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="اسم الفئة الجديدة..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-grow bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <button type="submit" className="bg-emerald-600 text-white font-semibold p-2.5 rounded-lg hover:bg-emerald-700 flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories.length > 0 ? (
                    categories.map(category => (
                        <div key={category.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between group border border-gray-200/80">
                            <div className="flex items-center gap-3">
                                <TagIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-800">{category.name}</span>
                            </div>
                            <button onClick={() => deleteCategory(category.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full opacity-50 group-hover:opacity-100 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">لا توجد فئات. أضف واحدة للبدء.</p>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;
