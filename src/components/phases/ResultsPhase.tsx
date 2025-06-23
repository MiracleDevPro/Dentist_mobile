import React, { useState } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { MobileCard } from '../MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabSystem, TabContent } from '../TabSystem';
import { Share2, Copy, Save, FileDown, Printer } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const ResultsPhase: React.FC = () => {
  const { state, resetWorkflow } = useWorkflow();
  const [activeTab, setActiveTab] = useState('summary');
  const [caseName, setCaseName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveCase = () => {
    // In real implementation, this would save the case locally
    console.log('Saving case with name:', caseName);
  };

  const handleShareLink = () => {
    // In real implementation, this would generate a shareable link
    navigator.clipboard.writeText('https://toothshade.vision/shared/abc123');
    // Show toast notification
  };

  const handleSaveImage = () => {
    // In real implementation, this would save the image with analysis overlay
    console.log('Saving image with analysis overlay');
  };

  return (
    <div className="space-y-6">
      <MobileCard title="Case Summary">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-name">Case Name / Patient ID</Label>
            <Input
              id="case-name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="Enter a name or ID for this case"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-notes">Clinical Notes</Label>
            <Textarea
              id="case-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any clinical notes or observations"
              rows={3}
            />
          </div>

          {/* Results Preview */}
          <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center">
            <p className="text-gray-500">Results Preview Placeholder</p>
          </div>
        </div>
      </MobileCard>

      {/* Tabbed Content */}
      <TabSystem
        tabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'clinical', label: 'Clinical Notes' },
          { id: 'share', label: 'Share' },
        ]}
        defaultTab="summary"
        onChange={setActiveTab}
        className="mb-3"
      />

      {/* Tab Contents */}
      <TabContent active={activeTab === 'summary'}>
        <MobileCard title="Analysis Summary">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Primary Shade</h3>
                <div className="bg-amber-50 border border-amber-100 rounded p-3 mt-1 flex justify-between items-center">
                  <span className="font-medium text-xl">A2</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">92% Match</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Secondary Shade</h3>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-1 flex justify-between items-center">
                  <span className="font-medium text-xl">B2</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">84% Match</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">LAB Values</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">L</span>
                  <p className="font-medium">76.5</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">a</span>
                  <p className="font-medium">1.2</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">b</span>
                  <p className="font-medium">18.7</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Analysis Points</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Shade</th>
                      <th className="px-3 py-2 text-left">ΔE</th>
                      <th className="px-3 py-2 text-left">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2">1</td>
                      <td className="px-3 py-2">A2</td>
                      <td className="px-3 py-2">2.3</td>
                      <td className="px-3 py-2">92%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">2</td>
                      <td className="px-3 py-2">A2</td>
                      <td className="px-3 py-2">2.5</td>
                      <td className="px-3 py-2">89%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </MobileCard>
      </TabContent>

      <TabContent active={activeTab === 'clinical'}>
        <MobileCard title="Clinical Recommendations">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <h3 className="text-green-800 font-medium mb-2">Shade Family: A Group</h3>
              <p className="text-sm text-gray-700">
                Shade A2 indicates a slightly yellowish-reddish hue of medium value and medium-low chroma.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Layering Technique</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Base: A2 Dentin (80% thickness)</li>
                <li>Body: A1 Body (40% thickness)</li>
                <li>Enamel: Translucent Enamel (20% thickness)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Material Selection</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Composite: A2B + A2E with incisal translucency</li>
                <li>Ceramic: A2 with slight translucency gradient</li>
              </ul>
            </div>
          </div>
        </MobileCard>
      </TabContent>

      <TabContent active={activeTab === 'share'}>
        <MobileCard title="Share & Export Options">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2"
                onClick={handleShareLink}
              >
                <Share2 className="h-6 w-6" />
                <span className="text-sm">Copy Share Link</span>
              </Button>
              <Button
                variant="outline" 
                className="flex flex-col items-center justify-center h-24 space-y-2"
                onClick={handleSaveImage}
              >
                <FileDown className="h-6 w-6" />
                <span className="text-sm">Save Image</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2"
              >
                <Printer className="h-6 w-6" />
                <span className="text-sm">Print Report</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2"
              >
                <Copy className="h-6 w-6" />
                <span className="text-sm">Copy Results</span>
              </Button>
            </div>
          </div>
        </MobileCard>
      </TabContent>

      {/* Save Case Button */}
      <div className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={resetWorkflow}
          className="text-gray-500 hover:text-gray-700"
        >
          New Analysis
        </Button>
        
        <Button 
          onClick={handleSaveCase}
          disabled={!caseName}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Case
        </Button>
      </div>
    </div>
  );
};

export default ResultsPhase;
