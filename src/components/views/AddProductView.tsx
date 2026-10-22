import React, { useState } from 'react';
import {
  Scan,
  Plus,
  Info,
  Bookmark,
  ListPlus,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductImage } from '../common/ProductImage';
import { MarketplaceBadge } from '../common/MarketplaceBadge';

export const AddProductView: React.FC = () => {
  const { navigate, showToast } = useApp();
  const addProduct = (p: any) => showToast('Product added successfully', 'success');

  const [nameEn, setNameEn] = useState('Snickers 50g');
  const [nameAr, setNameAr] = useState('سنيكرز ٥٠ جم');
  const [barcode, setBarcode] = useState('5000159461122');
  const [category, setCategory] = useState('Confectionery');
  const [brand, setBrand] = useState('Snickers');
  const [subcategory, setSubcategory] = useState('Chocolate Bars');
  const [size, setSize] = useState('50');
  const [unit, setUnit] = useState('g (grams)');
  const [packSize, setPackSize] = useState('1');

  const [erpPrice, setErpPrice] = useState('3.25');
  const [sellingPrice, setSellingPrice] = useState('3.25');
  const [defaultMarkup, setDefaultMarkup] = useState('20');

  const [isActive, setIsActive] = useState(true);

  // Marketplace states
  const [marketplaces, setMarketplaces] = useState({
    talabat: { listed: true, price: '3.90', markup: '20' },
    snoonu: { listed: true, price: '3.90', markup: '20' },
    rafeeq: { listed: true, price: '3.90', markup: '20' },
    keeta: { listed: false, price: '—', markup: '—' },
  });

  const handleSave = (andAnother = false) => {
    if (!nameEn || !barcode) {
      showToast('Please provide at least product name and barcode', 'warning');
      return;
    }

    addProduct({
      sku: 'SNK-' + barcode.slice(-4),
      nameEn,
      nameAr,
      barcode,
      category,
      subcategory,
      brand,
      size,
      unit: unit.split(' ')[0],
      packSize: parseInt(packSize, 10) || 1,
      erpPrice: parseFloat(erpPrice) || 3.25,
      costPrice: parseFloat(erpPrice) * 0.7,
      defaultMarkup: parseFloat(defaultMarkup) || 20,
      sellingPrice: parseFloat(sellingPrice) || 3.90,
      erpStock: 80,
      status: isActive ? 'Active' : 'Inactive',
      isNew: true,
      imageKey: 'snickers',
      marketplaces: {
        talabat: {
          listed: marketplaces.talabat.listed,
          price: parseFloat(marketplaces.talabat.price) || 3.90,
          expectedPrice: parseFloat(sellingPrice) || 3.25,
          stock: 80,
          erpStock: 80,
          customMarkup: parseFloat(marketplaces.talabat.markup) || 20,
        },
        snoonu: {
          listed: marketplaces.snoonu.listed,
          price: parseFloat(marketplaces.snoonu.price) || 3.90,
          expectedPrice: parseFloat(sellingPrice) || 3.25,
          stock: 80,
          erpStock: 80,
          customMarkup: parseFloat(marketplaces.snoonu.markup) || 20,
        },
        rafeeq: {
          listed: marketplaces.rafeeq.listed,
          price: parseFloat(marketplaces.rafeeq.price) || 3.90,
          expectedPrice: parseFloat(sellingPrice) || 3.25,
          stock: 80,
          erpStock: 80,
          customMarkup: parseFloat(marketplaces.rafeeq.markup) || 20,
        },
        keeta: {
          listed: marketplaces.keeta.listed,
          note: 'No file uploaded yet',
        },
      },
    });

    if (andAnother) {
      setNameEn('');
      setNameAr('');
      setBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
      showToast('Ready to add another product');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <button
            onClick={() => navigate('catalogue')}
            className="hover:text-gray-800 text-blue-600 hover:underline"
          >
            Catalogue
          </button>
          <span>/</span>
          <span className="text-gray-700">Add new product</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Add new product
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Add product details, set your price and markups, and list on marketplaces.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Container (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Basic information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form inputs (2 cols) */}
              <div className="md:col-span-2 space-y-4 text-xs">
                {/* English & Arabic Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Product name (English) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-[#027864]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Product name (Arabic) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white text-right font-arabic focus:ring-1 focus:ring-[#027864]"
                    />
                  </div>
                </div>

                {/* Barcode & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Barcode (GTIN) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 pr-8 text-xs font-mono bg-white focus:ring-1 focus:ring-[#027864]"
                      />
                      <Scan className="w-4 h-4 absolute right-2.5 top-2.5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                    >
                      <option>Confectionery</option>
                      <option>Soft Drinks</option>
                      <option>Dairy</option>
                      <option>Snacks</option>
                      <option>Water</option>
                    </select>
                  </div>
                </div>

                {/* Brand & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                    >
                      <option>Snickers</option>
                      <option>Pepsi</option>
                      <option>Lay's</option>
                      <option>Baladna</option>
                      <option>KitKat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                    >
                      <option>Chocolate Bars</option>
                      <option>Chips & Crisps</option>
                      <option>Biscuits & Cookies</option>
                      <option>Candy & Sweets</option>
                    </select>
                  </div>
                </div>

                {/* Size & Pack size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Size <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                      >
                        <option>g (grams)</option>
                        <option>ml (milliliters)</option>
                        <option>L (liters)</option>
                        <option>kg (kilograms)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-900 mb-1">
                      Pack size
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={packSize}
                        onChange={(e) => setPackSize(e.target.value)}
                        className="w-24 border border-gray-200 rounded-lg p-2 text-xs bg-white"
                      />
                      <span className="text-xs text-gray-500">piece(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Image widget (1 col) */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-900">
                  Product image
                </label>
                <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                  <div className="w-44 h-24 flex items-center justify-center">
                    <ProductImage imageKey="snickers" size="xl" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-14 h-12 border-2 border-[#027864] rounded-lg p-1 flex items-center justify-center bg-gray-50">
                    <ProductImage imageKey="snickers" size="sm" />
                  </div>
                  <button
                    onClick={() => showToast('Select extra product image')}
                    className="w-14 h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px]">Add image</span>
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  Recommended: 1000 × 1000 px (JPG or PNG) <br />
                  Max size: 5 MB
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pricing Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Pricing</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <label className="block font-medium text-gray-900 mb-1">
                  ERP price (QAR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={erpPrice}
                  onChange={(e) => setErpPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white font-medium"
                />
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Your cost price from ERP (for reference).</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-1">
                  Selling price (QAR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white font-medium"
                />
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>This is your base price. Markups will be applied for each marketplace.</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-900 mb-1">
                  Default markup
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={defaultMarkup}
                    onChange={(e) => setDefaultMarkup(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 pr-7 text-xs bg-white font-medium"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 font-semibold">%</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Used to calculate marketplace prices (you can set different markups per marketplace).</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Marketplace Listing Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Marketplace listing</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Marketplace</th>
                    <th className="py-2.5 px-3 text-center">List product</th>
                    <th className="py-2.5 px-3">Price (QAR)</th>
                    <th className="py-2.5 px-3">Custom markup</th>
                    <th className="py-2.5 px-3 text-right">Listing status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Talabat */}
                  <tr>
                    <td className="py-3 px-3">
                      <MarketplaceBadge marketplace="talabat" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={marketplaces.talabat.listed}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            talabat: { ...marketplaces.talabat, listed: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded accent-[#027864]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={marketplaces.talabat.price}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            talabat: { ...marketplaces.talabat, price: e.target.value },
                          })
                        }
                        className="w-24 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={marketplaces.talabat.markup}
                          onChange={(e) =>
                            setMarketplaces({
                              ...marketplaces,
                              talabat: { ...marketplaces.talabat, markup: e.target.value },
                            })
                          }
                          className="w-16 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#E3FAF3] text-[#027864]">
                        Will be listed
                      </span>
                    </td>
                  </tr>

                  {/* Snoonu */}
                  <tr>
                    <td className="py-3 px-3">
                      <MarketplaceBadge marketplace="snoonu" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={marketplaces.snoonu.listed}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            snoonu: { ...marketplaces.snoonu, listed: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded accent-[#027864]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={marketplaces.snoonu.price}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            snoonu: { ...marketplaces.snoonu, price: e.target.value },
                          })
                        }
                        className="w-24 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={marketplaces.snoonu.markup}
                          onChange={(e) =>
                            setMarketplaces({
                              ...marketplaces,
                              snoonu: { ...marketplaces.snoonu, markup: e.target.value },
                            })
                          }
                          className="w-16 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#E3FAF3] text-[#027864]">
                        Will be listed
                      </span>
                    </td>
                  </tr>

                  {/* Rafeeq */}
                  <tr>
                    <td className="py-3 px-3">
                      <MarketplaceBadge marketplace="rafeeq" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={marketplaces.rafeeq.listed}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            rafeeq: { ...marketplaces.rafeeq, listed: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded accent-[#027864]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={marketplaces.rafeeq.price}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            rafeeq: { ...marketplaces.rafeeq, price: e.target.value },
                          })
                        }
                        className="w-24 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={marketplaces.rafeeq.markup}
                          onChange={(e) =>
                            setMarketplaces({
                              ...marketplaces,
                              rafeeq: { ...marketplaces.rafeeq, markup: e.target.value },
                            })
                          }
                          className="w-16 border border-gray-200 rounded-lg p-1.5 text-xs bg-white font-medium"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#E3FAF3] text-[#027864]">
                        Will be listed
                      </span>
                    </td>
                  </tr>

                  {/* Keeta */}
                  <tr>
                    <td className="py-3 px-3">
                      <MarketplaceBadge marketplace="keeta" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={marketplaces.keeta.listed}
                        onChange={(e) =>
                          setMarketplaces({
                            ...marketplaces,
                            keeta: { ...marketplaces.keeta, listed: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded accent-[#027864]"
                      />
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-medium">—</td>
                    <td className="py-3 px-3 text-gray-400 font-medium">— %</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                        Not listed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => navigate('catalogue')}
              className="px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              className="px-6 py-2 text-xs font-semibold text-white bg-[#027864] hover:bg-[#02604F] rounded-lg shadow-xs"
            >
              Save product
            </button>
          </div>
        </div>

        {/* Right Sidebar: Status, Quick actions, Tips */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Status
            </h3>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  isActive ? 'bg-[#027864]' : 'bg-gray-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-gray-900">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="text-[11px] text-gray-500 leading-tight">
              Inactive products will not be listed on any marketplace.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Quick actions
            </h3>

            <div className="space-y-1">
              <button
                onClick={() => handleSave(true)}
                className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
              >
                <ListPlus className="w-4 h-4 text-gray-500" />
                <span>Save and add another</span>
              </button>

              <button
                onClick={() => showToast('Saved as product template')}
                className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
              >
                <Bookmark className="w-4 h-4 text-gray-500" />
                <span>Save as template</span>
              </button>

              <button
                onClick={() => navigate('catalogue')}
                className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
              >
                <Eye className="w-4 h-4 text-gray-500" />
                <span>View in catalogue</span>
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Tips</span>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-gray-600 text-[11px]">
              <li>Use the product barcode to avoid duplicates.</li>
              <li>Add clear images with white background.</li>
              <li>Set custom markups per marketplace if needed.</li>
              <li>You can edit these details later.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
