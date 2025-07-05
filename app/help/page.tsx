export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
      <p className="mb-8 text-muted-foreground text-lg">Find answers to common questions or contact our support team for help.</p>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-lg mb-1">How do I create a note?</h2>
          <p>Click <strong>New Note</strong> or use the Quick Notes option in the sidebar. Your notes are saved automatically.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-1">How do I share a note?</h2>
          <p>Open a note and click the <strong>Share</strong> button to share with a user by email.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-1">How do I use templates?</h2>
          <p>Go to the <strong>Templates</strong> page to browse and use note templates for meetings, journals, and more.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-1">Need more help?</h2>
          <p>Email <a href="mailto:support@noteforge.com" className="text-blue-600 underline">support@noteforge.com</a> and our team will respond within 24 hours.</p>
        </div>
      </div>
    </div>
  )
} 