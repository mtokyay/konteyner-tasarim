  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = getSupabase();

      let logoUrl = companyData.logo_url;

      if (logoFile) {
        const fileName = `company-logo-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage
          .from('company-files')
          .getPublicUrl(fileName);
        logoUrl = publicUrl.publicUrl;
      }

      const saveData = {
        ...companyData,
        logo_url: logoUrl,
        contract_terms: contractTerms,
        qc_items: qcItems,
        bank_name: bankInfo.bank_name,
        bank_branch: bankInfo.branch,
        bank_iban: bankInfo.iban,
        bank_account_no: bankInfo.account_no,
        proforma_footer_note: bankInfo.footer_note
      };

      const { error } = await supabase
        .from('company_info')
        .upsert(saveData, { onConflict: 'id' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Veriler başarıyla kaydedildi' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setMessage({ type: 'error', text: 'Kaydetme sırasında hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  const addContractTerm = () => {
    setContractTerms([...contractTerms, 'Yeni madde']);
  };

  const updateContractTerm = (index, value) => {
    const updated = [...contractTerms];
    updated[index] = value;
    setContractTerms(updated);
  };

  const removeContractTerm = (index) => {
    setContractTerms(contractTerms.filter((_, i) => i !== index));