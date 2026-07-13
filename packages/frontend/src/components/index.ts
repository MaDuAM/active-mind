// ============================================
// FILE: frontend/src/components/index.ts
// PURPOSE: Central export barrel for all UI components
// DEPENDENCIES: All component implementations
// ============================================

// ============================================
// ENTRY COMPONENTS
// ============================================
export { EntryRow } from './EntryRow';
export { EntryView } from './EntryView';
export { EntryEdit } from './EntryEdit';
export { default as EntryDetail } from './EntryDetail';

// ============================================
// FORM COMPONENTS
// ============================================
export { default as NewEntryForm } from './NewEntryForm';
export { StepEditor } from './StepEditor';
export { TopicSelector } from './TopicSelector';
export { EntryFormFields } from './EntryFormFields';

// ============================================
// POPUP / DIALOG COMPONENTS
// ============================================
export { TrackingPopup } from './TrackingPopup';
export { ManualTrackPopup } from './ManualTrackPopup';
export { ConfirmDialog } from './ConfirmDialog';

// ============================================
// LAYOUT COMPONENTS
// ============================================
export { SearchLayer } from './SearchLayer';
export { Sidebar } from './Sidebar';
export { MobileBottomBar } from './MobileBottomBar';
export { MenuOverlay } from './MenuOverlay';

// ============================================
// AUTH / FEEDBACK COMPONENTS
// ============================================
export { Login } from './Login';
export { Toast } from './Toast';
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingOverlay } from './LoadingOverlay';

// ============================================
// UTILITY COMPONENTS
// ============================================
export { ScrollToTop } from './ScrollToTop';
export { default as StarIcon } from './StarIcon';