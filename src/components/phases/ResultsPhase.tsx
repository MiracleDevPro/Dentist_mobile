import React, { useEffect, useState } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { MobileCard } from '../MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabSystem, TabContent } from '../TabSystem';
import { Share2, Copy, Save, FileDown, Printer } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast';

function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  while (result.length < length) {
    const char = chars.charAt(Math.floor(Math.random() * chars.length));
    if (!result.includes(char)) result += char;
  }
  return result;
}

const ResultsPhase: React.FC = () => {
  const { state, resetWorkflow } = useWorkflow();
  const [activeTab, setActiveTab] = useState('summary');
  const [caseName, setCaseName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState("");
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  const [uploadUrl, setUploadUrl] = useState('');
  const supabase = createClient(supabaseUrl, supabaseKey)

  const handleSaveCase = () => {
    // In real implementation, this would save the case locally
    console.log('Saving case with name:', caseName);
  };

  const handleShareLink = () => {
    if (!uploadUrl) {
      toast.error('No link to share!');
      return;
    }
    const phoneNumber_client = '358505151330';
    const phoneNumber_me = '12145518680'; // Example India number
    const message = encodeURIComponent(`Check out this image: ${uploadUrl}`);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber_client}&text=${message}`;

    
    window.open(whatsappUrl, '_blank');// Show toast notification if desired
  };

  const handleSaveImage = async () => {
    const file = state.processedImage;
    if (!file) {
      toast.error('No image to save!');
      return;
    }

    setFileName(`media/${Date.now()}_${file.name}`) ;

    const { error } = await supabase.storage
      .from('dentist')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      toast.error('Failed to save image!');
      return;
    }
    toast.success('Image saved successfully!');
  };

  useEffect(() => {
  // Get the public URL
  const { data: publicUrlData } = supabase.storage
  .from('dentist')
  .getPublicUrl(fileName);

  setUploadUrl(publicUrlData.publicUrl);
  }, [fileName])

  return (
    <div className="space-y-6 px-2 sm:px-4 py-4 w-full max-w-2xl mx-auto min-h-screen">
      <MobileCard title="Case Summary" className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
        <div className="space-y-5">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-name" className="font-medium text-gray-800">Case Name / Patient ID</Label>
            <Input
              className="placeholder:text-gray-500 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-base"
              id="case-name"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="Enter a name or ID for this case"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-notes" className="font-medium text-gray-800">Clinical Notes</Label>
            <Textarea
              id="case-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any clinical notes or observations"
              rows={3}
              className="placeholder:text-gray-500 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-base"
            />
          </div>

          {/* Results Preview */}
          <div className="bg-white border border-gray-200 rounded-xl h-40 flex items-center justify-center shadow-sm">
            <p className="text-gray-400">Results Preview Placeholder</p>
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
        <MobileCard title="Analysis Summary" className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Primary Shade</h3>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-1 flex justify-between items-center">
                  <span className="font-semibold text-xl text-gray-800">A2</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">92% Match</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Secondary Shade</h3>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-1 flex justify-between items-center">
                  <span className="font-semibold text-xl text-gray-800">B2</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">84% Match</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">LAB Values</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">L</span>
                  <p className="font-semibold text-gray-800">76.5</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">a</span>
                  <p className="font-semibold text-gray-800">1.2</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-xs text-gray-500">b</span>
                  <p className="font-semibold text-gray-800">18.7</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Analysis Points</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Shade</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">ΔE</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
        <MobileCard title="Clinical Recommendations" className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <h3 className="text-green-800 font-semibold mb-2">Shade Family: A Group</h3>
              <p className="text-sm text-gray-700">
                Shade A2 indicates a slightly yellowish-reddish hue of medium value and medium-low chroma.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Layering Technique</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>Base: A2 Dentin (80% thickness)</li>
                <li>Body: A1 Body (40% thickness)</li>
                <li>Enamel: Translucent Enamel (20% thickness)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Material Selection</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>Composite: A2B + A2E with incisal translucency</li>
                <li>Ceramic: A2 with slight translucency gradient</li>
              </ul>
            </div>
          </div>
        </MobileCard>
      </TabContent>

      <TabContent active={activeTab === 'share'}>
        <MobileCard title="Share & Export Options" className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2 border-blue-100 hover:bg-blue-50 transition"
                onClick={handleShareLink}
              >
                <Share2 className="h-6 w-6 text-blue-500" />
                <span className="text-sm text-blue-700">Copy Share Link</span>
              </Button>
              <Button
                variant="outline" 
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 hover:bg-blue-50 transition"
                onClick={handleSaveImage}
              >
                <FileDown className="h-6 w-6 text-blue-500" />
                <span className="text-sm text-gray-700">Save Image</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 hover:bg-blue-50 transition"
              >
                <Printer className="h-6 w-6 text-blue-500" />
                <span className="text-sm text-gray-700">Print Report</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 hover:bg-blue-50 transition"
              >
                <Copy className="h-6 w-6 text-blue-500" />
                <span className="text-sm text-gray-700">Copy Results</span>
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
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          New Analysis
        </Button>
        
        <Button 
          onClick={handleSaveCase}
          disabled={!caseName}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          <Save className="w-4 h-4" />
          Save Case
        </Button>
      </div>
    </div>
  );
};

export default ResultsPhase;
