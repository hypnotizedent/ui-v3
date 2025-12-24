import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface DemoDataGeneratorProps {
  onGenerate: () => void;
}

export function DemoDataGenerator({ onGenerate }: DemoDataGeneratorProps) {
  const handleGenerate = async () => {
    const generateDemoData = async () => {
      const demoOrders = [
        {
          id: 'demo-order-1',
          visual_id: 'MP-2024-001',
          customer_name: 'ABC Company',
          status: 'In Production',
          total: 1250.00,
        },
        {
          id: 'demo-order-2',
          visual_id: 'MP-2024-002',
          customer_name: 'XYZ Corp',
          status: 'Quote',
          total: 850.50,
        }
      ];

      const demoCustomers = [
        {
          id: 'demo-customer-1',
          name: 'John Smith',
          email: 'john@abccompany.com',
          phone: '555-0100',
          company: 'ABC Company',
          tier: 'gold'
        },
        {
          id: 'demo-customer-2',
          name: 'Jane Doe',
          email: 'jane@xyzcorp.com',
          phone: '555-0200',
          company: 'XYZ Corp',
          tier: 'silver'
        }
      ];

      const demoArtwork = [
        {
          id: 'demo-artwork-1',
          filename: 'logo-front.png',
          approved: true,
          uploaded_at: new Date().toISOString(),
        },
        {
          id: 'demo-artwork-2',
          filename: 'design-back.ai',
          approved: false,
          uploaded_at: new Date().toISOString(),
        }
      ];

      const generateVersionHistory = (entity: any, entityType: string, entityId: string) => {
        const versions: any[] = [];
        const changes = [
          { desc: 'Initial creation', fields: [] as string[] },
          { desc: 'Updated pricing', fields: ['total', 'subtotal'] },
          { desc: 'Modified due date', fields: ['due_date'] },
          { desc: 'Status changed', fields: ['status'] },
          { desc: 'Customer information updated', fields: ['customer_name', 'customer_id'] }
        ];

        const baseDate = new Date();
        for (let i = 0; i < Math.min(3, changes.length); i++) {
          const versionDate = new Date(baseDate);
          versionDate.setHours(versionDate.getHours() - (changes.length - i) * 2);
          
          versions.push({
            version: i + 1,
            timestamp: versionDate.toISOString(),
            user_name: i === 0 ? 'System' : 'Demo User',
            change_description: changes[i].desc,
            fields_changed: changes[i].fields,
            data: { ...entity }
          });
        }

        const versionedEntity = {
          entity_id: entityId,
          entity_type: entityType,
          current_version: versions.length,
          versions: versions
        };

        return versionedEntity;
      };

      try {
        for (const order of demoOrders) {
          const versionedOrder = generateVersionHistory(order, 'order', order.id);
          await window.spark.kv.set(`version_order_${order.id}`, versionedOrder);
        }

        const orderKeys = demoOrders.map(o => `version_order_${o.id}`);
        await window.spark.kv.set('version_order_keys', orderKeys);

        for (const customer of demoCustomers) {
          const versionedCustomer = generateVersionHistory(customer, 'customer', customer.id);
          await window.spark.kv.set(`version_customer_${customer.id}`, versionedCustomer);
        }

        const customerKeys = demoCustomers.map(c => `version_customer_${c.id}`);
        await window.spark.kv.set('version_customer_keys', customerKeys);

        for (const artwork of demoArtwork) {
          const versionedArtwork = generateVersionHistory(artwork, 'artwork', artwork.id);
          await window.spark.kv.set(`version_artwork_${artwork.id}`, versionedArtwork);
        }

        const artworkKeys = demoArtwork.map(a => `version_artwork_${a.id}`);
        await window.spark.kv.set('version_artwork_keys', artworkKeys);

        return true;
      } catch (error) {
        console.error('Error generating demo data:', error);
        return false;
      }
    };

    toast.promise(generateDemoData(), {
      loading: 'Generating demo version history...',
      success: () => {
        onGenerate();
        return 'Demo data created! Browse the tabs above to see version history.';
      },
      error: 'Failed to generate demo data'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle size={20} />
          Demo Data
        </CardTitle>
        <CardDescription>
          Generate sample version history to explore the version control features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGenerate} className="w-full gap-2">
          <Sparkle size={16} />
          Generate Demo Version History
        </Button>
      </CardContent>
    </Card>
  );
}
