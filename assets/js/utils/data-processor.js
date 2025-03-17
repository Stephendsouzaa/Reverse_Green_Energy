function normalizeData(data) {
    return data.map(item => ({ ...item, value: item.value / 100 }));
}