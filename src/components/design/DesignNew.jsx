import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, X } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import DesignEditor from './DesignEditor';

const DesignNew = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Select customer, Step 2: Edit design
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Customer selection
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    nereden_geldi: '',
  });

  // Placeholder customers
  const placeholderCustomers = [
    {
      id: 1,
      ad: 'Ahmet',
      soyad: 'Yılmaz',
      telefon: '0312 555 0001',
      nereden_geldi: 'Web',
    },
    {
      id: 2,
      ad: 'İbrahim',
      soyad: 'Demir',
      telefon: '0312 555 0002',
      nereden_geldi: 'Telefon',
    },
    {
      id: 3,
      ad: 'Fatma',
      soyad: 'Kaya',
      telefon: '0312 555 0003',
      nereden_geldi: 'Referans',
    },
    {
      id: 4,
      ad: 'Murat',
      soyad: 'Ağıl',
      telefon: '0312 555 0004',
      nereden_geldi: 'Web',
    },
    {
      id: 5,
      ad: 'Zeynep',
      soyad: 'Çetinkaya',
      telefon: '0312 555 0005',
      nereden_geldi: 'Telefon',
    },
  ];

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const supabase = getSupabase();

        if (!supabase) {
          console.warn('Supabase not configured, using placeholder data');
          setCustomers(placeholderCustomers);
          setCustomersLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .order('ad');

        if (fetchError) {
          throw fetchError;
        }

        setCustomers(data || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Müşteriler yüklenirken hata oluştu');
        setCustomers(placeholderCustomers);
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    `${customer.ad} ${customer.soyad}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setShowNewCustomerForm(false);
    setStep(2);
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomer.ad || !newCustomer.soyad) {
      setError('Adı ve soyadı zorunludur');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();

      if (!supabase) {
        // Mock create customer
        const mockCustomer = {
          id: Math.random(),
          ...newCustomer,
        };
        setSelectedCustomer(mockCustomer);
        setStep(2);
        setShowNewCustomerForm(false);
        setNewCustomer({
          ad: '',
          soyad: '',
          telefon: '',
          nereden_geldi: '',
        });
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSelectedCustomer(data);
      setStep(2);
      setShowNewCustomerForm(false);
      setNewCustomer({
        ad: '',
        soyad: '',
        telefon: '',
        nereden_geldi: '',
      });
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Müşteri oluşturulurken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCustomers = () => {
    setStep(1);
    setSelectedCustomer(null);
  };

  const handleDesignSaved = (designId) => {
    navigate(`/designs/${designId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Yeni Tasarım</h1>
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span
              className={`font-medium ${
                step === 1 ? 'text-amber-700' : 'text-gray-500'
              }`}
            >
              Müşteri Seçimi
            </span>
            <ChevronRight size={16} className="text-gray-400" />
            <span
              className={`font-medium ${
                step === 2 ? 'text-amber-700' : 'text-gray-500'
              }`}
            >
              Tasarımı Düzenle
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Existing Customers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Müşteri Seçin
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Ad, soyad ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>

              {/* Loading State */}
              {customersLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Müşteriler yükleniyor...</p>
                  </div>
                </div>
              )}

              {/* Customer List */}
              {!customersLoading && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {customer.ad} {customer.soyad}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.telefon}
                        </div>
                        {customer.nereden_geldi && (
                          <div className="text-xs text-gray-500 mt-1">
                            Kaynak: {customer.nereden_geldi}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      {searchQuery
                        ? 'Sonuç bulunamadı'
                        : 'Müşteri bulunamadı'}
                    </div>
                  )}
                </div>
              )}

              {/* New Customer Button */}
              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-amber-700 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium"
              >
                <Plus size={20} />
                Yeni Müşteri Ekle
              </button>
            </div>

            {/* New Customer Form */}
            {showNewCustomerForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Yeni Müşteri Ekle
                  </h2>
                  <button
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setNewCustomer({
                        ad: '',
                        soyad: '',
                        telefon: '',
                        nereden_geldi: '',
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.ad}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          ad: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soyad *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.soyad}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          soyad: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.telefon}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          telefon: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                    />
                  </div>

                  {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kaynak
                    </label>
                    <select
                      value={newCustomer.nereden_geldi}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          nereden_geldi: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
                    >
                      <option value="">Seçin</option>
                      <option value="Web">Web</option>
                      <option value="Telefon">Telefon</option>
                      <option value="Referans">Referans</option>
                      <option value="Reklam">Reklam</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateNewCustomer}
                      disabled={loading}
                      className="flex-1 bg-amber-700 text-white py-2 rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Oluşturuluyor...' : 'Müşteri Oluştur'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCustomerForm(false);
                        setNewCustomer({
                          ad: '',
                          soyad: '',
                          telefon: '',
                          nereden_geldi: '',
                        });
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Design Editor */}
        {step === 2 && selectedCustomer && (
          <DesignEditor
            customerId={selectedCustomer.id}
            customerName={`${selectedCustomer.ad} ${selectedCustomer.soyad}`}
            onSave={handleDesignSaved}
            onCancel={handleBackToCustomers}
          />
        )}
      </div>
    </div>
  );
};

export default DesignNew;
