// Central security validation for all user inputs across the application

export function validateName(name: any): { ok: boolean; sanitized?: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { ok: false, error: 'Name is required and must be text' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { ok: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { ok: false, error: 'Name must not exceed 100 characters' };
  }

  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { ok: false, error: 'Name can only contain letters, spaces, hyphens and apostrophes' };
  }

  return { ok: true, sanitized: trimmed };
}

export function validateDateArray(dates: any): { ok: boolean; sanitized?: string[]; error?: string } {
  if (!Array.isArray(dates)) {
    return { ok: false, error: 'Dates must be an array' };
  }

  if (dates.length === 0) {
    return { ok: false, error: 'At least one date is required' };
  }

  if (dates.length > 365) {
    return { ok: false, error: 'Cannot book more than 365 days at once' };
  }

  const sanitized: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const dateStr of dates) {
    if (typeof dateStr !== 'string') {
      return { ok: false, error: 'All dates must be strings' };
    }

    if (!dateRegex.test(dateStr)) {
      return { ok: false, error: `Invalid date format: ${dateStr}. Expected YYYY-MM-DD` };
    }

    // Validate it's a real date
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
      return { ok: false, error: `Invalid date value: ${dateStr}` };
    }

    // Validate not in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return { ok: false, error: `Cannot book dates in the past: ${dateStr}` };
    }

    // Validate not more than 2 years in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (date > maxDate) {
      return { ok: false, error: `Cannot book dates more than 2 years in advance: ${dateStr}` };
    }

    sanitized.push(dateStr);
  }

  // Check for duplicates
  const uniqueDates = new Set(sanitized);
  if (uniqueDates.size !== sanitized.length) {
    return { ok: false, error: 'Duplicate dates are not allowed' };
  }

  return { ok: true, sanitized };
}

export function validateDeskId(deskId: any): { ok: boolean; sanitized?: string; error?: string } {
  if (!deskId || typeof deskId !== 'string') {
    return { ok: false, error: 'Desk ID is required and must be a string' };
  }

  // Validate it's a valid UUID or cuid format
  const trimmed = deskId.trim();

  if (trimmed.length < 10 || trimmed.length > 50) {
    return { ok: false, error: 'Invalid desk ID format' };
  }

  // Basic alphanumeric check (most ID formats are alphanumeric)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { ok: false, error: 'Invalid desk ID format' };
  }

  return { ok: true, sanitized: trimmed };
}
